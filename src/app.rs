use std::path::PathBuf;
use eframe::egui::{self, Color32, FontFamily, FontId, Margin, Rounding, Stroke, TextureHandle, Vec2};
use chrono::Local;

use crate::models::{AppConfig, Budget, Expense, ExpensePreset, ProfileData, ProfileMeta, SharedData, Template};
use crate::storage::{
    delete_profile_file, duplicate_profile, load_config, load_profile, load_shared_data,
    migrate_legacy_budget, save_config, save_profile, save_shared_data,
};
use crate::ui::{
    render_balance_bar, render_dashboard, render_expenses, render_expenses_header, Calculator,
    CategoryAction, CategoryManager, ExpenseForm, HistoryAction, IncomeForm, PresetAction,
    PresetPanel, ProfileAction, ProfileManager, ProfileSelector, ProfileSelectorAction,
    TemplateAction, TemplateManager,
};

/// Get the path to a resource file, checking both development and bundle paths
fn get_resource_path(relative_path: &str) -> Option<PathBuf> {
    // Try development paths first
    let dev_paths = [
        PathBuf::from(format!("assets/{}", relative_path)),
        PathBuf::from(format!("../assets/{}", relative_path)),
        PathBuf::from(format!("./assets/{}", relative_path)),
        PathBuf::from(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/")).join(relative_path),
    ];

    for path in &dev_paths {
        if path.exists() {
            return Some(path.clone());
        }
    }

    // Try macOS app bundle path (Contents/Resources/assets/...)
    if let Ok(exe_path) = std::env::current_exe() {
        // exe is at Budgetbot.app/Contents/MacOS/budgetbot
        // resources are at Budgetbot.app/Contents/Resources/assets/
        if let Some(macos_dir) = exe_path.parent() {
            if let Some(contents_dir) = macos_dir.parent() {
                let bundle_path = contents_dir.join("Resources").join("assets").join(relative_path);
                if bundle_path.exists() {
                    return Some(bundle_path);
                }
            }
        }
    }

    None
}

pub struct BudgetApp {
    // Profile system
    config: AppConfig,
    current_profile_id: String,
    profile_data: ProfileData,
    shared_data: SharedData,

    // Composed budget view for UI compatibility
    budget: Budget,

    // UI components
    expense_form: ExpenseForm,
    income_form: IncomeForm,
    category_manager: CategoryManager,
    calculator: Calculator,
    template_manager: TemplateManager,
    preset_panel: PresetPanel,
    profile_selector: ProfileSelector,
    profile_manager: ProfileManager,

    logo_texture: Option<TextureHandle>,
}

impl BudgetApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        configure_styles(&cc.egui_ctx);

        // Run migration if needed (from old budget.json to new profile structure)
        let _ = migrate_legacy_budget();

        // Load configuration
        let config = load_config();

        // Load shared data (categories, presets, templates)
        let shared_data = load_shared_data();

        // Load active profile data
        let current_profile_id = config.active_profile_id.clone();
        let profile_data = load_profile(&current_profile_id);

        // Compose budget view for UI compatibility
        let budget = compose_budget(&profile_data, &shared_data);

        // Load the logo image
        let logo_texture = load_logo(&cc.egui_ctx);

        Self {
            config,
            current_profile_id,
            profile_data,
            shared_data,
            budget,
            expense_form: ExpenseForm::new(),
            income_form: IncomeForm::new(),
            category_manager: CategoryManager::new(),
            calculator: Calculator::new(),
            template_manager: TemplateManager::new(),
            preset_panel: PresetPanel::new(),
            profile_selector: ProfileSelector::new(),
            profile_manager: ProfileManager::new(),
            logo_texture,
        }
    }

    /// Switch to a different profile
    fn switch_profile(&mut self, profile_id: &str) {
        // Save current profile first
        self.save_profile();

        // Load new profile
        self.current_profile_id = profile_id.to_string();
        self.profile_data = load_profile(profile_id);

        // Update config
        self.config.active_profile_id = profile_id.to_string();
        let _ = save_config(&self.config);

        // Recompose budget view
        self.recompose_budget();
    }

    /// Cycle to the next profile in the list
    fn cycle_to_next_profile(&mut self) {
        if self.config.profiles.len() <= 1 {
            return; // Nothing to cycle through
        }

        // Find current profile index
        let current_index = self.config.profiles
            .iter()
            .position(|p| p.id == self.current_profile_id)
            .unwrap_or(0);

        // Get next profile (wrapping around)
        let next_index = (current_index + 1) % self.config.profiles.len();
        let next_profile_id = self.config.profiles[next_index].id.clone();

        self.switch_profile(&next_profile_id);
    }

    /// Save profile-specific data only
    fn save_profile(&self) {
        let _ = save_profile(&self.current_profile_id, &self.profile_data);
    }

    /// Save shared data only
    fn save_shared(&self) {
        let _ = save_shared_data(&self.shared_data);
    }

    /// Recompose the budget view after changes
    fn recompose_budget(&mut self) {
        self.budget = compose_budget(&self.profile_data, &self.shared_data);
    }

    /// Save both profile and shared data (legacy compatibility)
    fn save(&mut self) {
        self.save_profile();
        self.save_shared();
        self.recompose_budget();
    }

    /// Handle profile management actions
    fn handle_profile_action(&mut self, action: ProfileAction) {
        match action {
            ProfileAction::Create(name) => {
                let id = self.config.generate_profile_id(&name);
                let meta = ProfileMeta::new(id.clone(), name);
                self.config.add_profile(meta);
                let _ = save_config(&self.config);
                // Create empty profile file
                let _ = save_profile(&id, &ProfileData::default());
            }
            ProfileAction::Duplicate(source_id, new_name) => {
                let new_id = self.config.generate_profile_id(&new_name);
                let meta = ProfileMeta::new(new_id.clone(), new_name);
                self.config.add_profile(meta);
                let _ = save_config(&self.config);
                // Duplicate the profile data
                let _ = duplicate_profile(&source_id, &new_id);
            }
            ProfileAction::Rename(id, new_name) => {
                self.config.rename_profile(&id, new_name);
                let _ = save_config(&self.config);
            }
            ProfileAction::Delete(id) => {
                if self.config.remove_profile(&id) {
                    let _ = delete_profile_file(&id);
                    let _ = save_config(&self.config);
                }
            }
            ProfileAction::Switch(id) => {
                self.switch_profile(&id);
                self.profile_manager.close();
            }
        }
    }
}

/// Compose a Budget view from profile and shared data
fn compose_budget(profile: &ProfileData, shared: &SharedData) -> Budget {
    Budget {
        income: profile.income,
        expenses: profile.expenses.clone(),
        categories: shared.categories.clone(),
        category_colors: shared.category_colors.clone(),
        templates: shared.templates.clone(),
        presets: shared.presets.clone(),
    }
}

fn load_logo(ctx: &egui::Context) -> Option<TextureHandle> {
    if let Some(path) = get_resource_path("applogo.png") {
        if let Ok(image_data) = std::fs::read(&path) {
            if let Ok(image) = image::load_from_memory(&image_data) {
                let rgba = image.to_rgba8();
                let size = [rgba.width() as usize, rgba.height() as usize];
                let pixels = rgba.into_raw();
                let color_image = egui::ColorImage::from_rgba_unmultiplied(size, &pixels);
                return Some(ctx.load_texture("logo", color_image, egui::TextureOptions::LINEAR));
            }
        }
    }
    None
}

// Embed the Beyonders font directly into the binary
const BEYONDERS_FONT: &[u8] = include_bytes!(concat!(env!("CARGO_MANIFEST_DIR"), "/assets/beyonders/Beyonders.ttf"));

fn configure_styles(ctx: &egui::Context) {
    // Load custom Beyonders font (embedded in binary)
    let mut fonts = egui::FontDefinitions::default();

    fonts.font_data.insert(
        "Beyonders".to_owned(),
        egui::FontData::from_static(BEYONDERS_FONT).into(),
    );

    // Add Beyonders as a custom font family
    fonts.families.insert(
        FontFamily::Name("Beyonders".into()),
        vec!["Beyonders".to_owned()],
    );

    ctx.set_fonts(fonts);

    let mut style = (*ctx.style()).clone();

    // Modern rounded corners - more pronounced
    style.visuals.window_rounding = Rounding::same(16.0);
    style.visuals.widgets.noninteractive.rounding = Rounding::same(10.0);
    style.visuals.widgets.inactive.rounding = Rounding::same(10.0);
    style.visuals.widgets.hovered.rounding = Rounding::same(10.0);
    style.visuals.widgets.active.rounding = Rounding::same(10.0);

    // Modern light theme - softer background
    style.visuals.dark_mode = false;
    style.visuals.panel_fill = Color32::from_rgb(245, 247, 250);
    style.visuals.window_fill = Color32::WHITE;
    style.visuals.extreme_bg_color = Color32::from_rgb(240, 242, 245);

    // Widget colors - cleaner whites with subtle depth
    style.visuals.widgets.noninteractive.bg_fill = Color32::from_rgb(248, 249, 252);
    style.visuals.widgets.inactive.bg_fill = Color32::WHITE;
    style.visuals.widgets.hovered.bg_fill = Color32::from_rgb(245, 247, 250);
    style.visuals.widgets.active.bg_fill = Color32::from_rgb(240, 242, 248);

    // Softer borders
    style.visuals.widgets.noninteractive.bg_stroke = Stroke::new(1.0, Color32::from_rgb(230, 232, 240));
    style.visuals.widgets.inactive.bg_stroke = Stroke::new(1.0, Color32::from_rgb(225, 228, 235));
    style.visuals.widgets.hovered.bg_stroke = Stroke::new(1.5, Color32::from_rgb(200, 205, 220));

    // Text colors - better contrast
    style.visuals.widgets.noninteractive.fg_stroke = Stroke::new(1.0, Color32::from_rgb(55, 65, 81));
    style.visuals.widgets.inactive.fg_stroke = Stroke::new(1.0, Color32::from_rgb(75, 85, 99));
    style.visuals.widgets.hovered.fg_stroke = Stroke::new(1.0, Color32::from_rgb(17, 24, 39));

    // Better spacing for modern feel
    style.spacing.item_spacing = Vec2::new(12.0, 10.0);
    style.spacing.button_padding = Vec2::new(18.0, 10.0);
    style.spacing.window_margin = Margin::same(24.0);

    // Smoother animations
    style.animation_time = 0.15;

    ctx.set_style(style);
}

impl eframe::App for BudgetApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Render category manager popup window
        let actions = self.category_manager.render(ctx, &self.shared_data.categories, &self.shared_data.category_colors);
        for action in actions {
            match action {
                CategoryAction::Add(name, color) => {
                    self.shared_data.add_category_with_color(name, color);
                    self.save_shared();
                    self.recompose_budget();
                }
                CategoryAction::Delete(name) => {
                    self.shared_data.remove_category(&name);
                    self.save_shared();
                    self.recompose_budget();
                }
                CategoryAction::UpdateColor(name, color) => {
                    self.shared_data.set_category_color(&name, color);
                    self.save_shared();
                    self.recompose_budget();
                }
            }
        }

        // Render expense form popup window
        let (expense, new_cat) = self.expense_form.render(
            ctx,
            &self.shared_data.categories,
            &self.shared_data.category_colors,
        );
        if let Some((cat_name, cat_color)) = new_cat {
            self.shared_data.add_category_with_color(cat_name, cat_color);
            self.save_shared();
            self.recompose_budget();
        }
        if let Some(exp) = expense {
            self.profile_data.expenses.push(exp);
            self.save_profile();
            self.recompose_budget();
        }

        // Render income form popup window
        if let Some(new_income) = self.income_form.render(ctx) {
            self.profile_data.income = new_income;
            self.save_profile();
            self.recompose_budget();
        }

        // Render calculator popup window
        self.calculator.render(ctx);

        // Render template manager popup window
        let template_actions = self.template_manager.render(
            ctx,
            &self.shared_data.templates,
            self.profile_data.expenses.len(),
            &self.shared_data.categories,
            &self.shared_data.category_colors,
        );
        for action in template_actions {
            match action {
                TemplateAction::Save(name) => {
                    let template = Template::new(name, self.profile_data.expenses.clone());
                    self.shared_data.add_template(template);
                    self.save_shared();
                    self.recompose_budget();
                }
                TemplateAction::Load(id) => {
                    // Load template expenses into profile (replaces)
                    if let Some(template) = self.shared_data.templates.iter().find(|t| t.id == id) {
                        self.profile_data.expenses = template.expenses.iter().map(|e| {
                            Expense::new(e.amount, e.category.clone(), e.description.clone(), e.date)
                        }).collect();
                        self.save_profile();
                        self.recompose_budget();
                    }
                    self.template_manager.close();
                }
                TemplateAction::Append(id) => {
                    // Append template expenses to profile
                    if let Some(template) = self.shared_data.templates.iter().find(|t| t.id == id) {
                        for e in &template.expenses {
                            let expense = Expense::new(e.amount, e.category.clone(), e.description.clone(), e.date);
                            self.profile_data.expenses.push(expense);
                        }
                        self.save_profile();
                        self.recompose_budget();
                    }
                    self.template_manager.close();
                }
                TemplateAction::Delete(id) => {
                    self.shared_data.delete_template(id);
                    self.save_shared();
                    self.recompose_budget();
                }
                TemplateAction::Rename(id, new_name) => {
                    self.shared_data.rename_template(id, new_name);
                    self.save_shared();
                    self.recompose_budget();
                }
                TemplateAction::UpdateExpenses(id, expenses) => {
                    self.shared_data.update_template_expenses(id, expenses);
                    self.save_shared();
                    self.recompose_budget();
                }
            }
        }

        // Render preset panel (slide-out on right)
        let preset_actions = self.preset_panel.render(
            ctx,
            &self.shared_data.presets,
            &self.shared_data.categories,
            &self.shared_data.category_colors,
        );
        for action in preset_actions {
            match action {
                PresetAction::Create(preset) => {
                    self.shared_data.add_preset(preset);
                    self.save_shared();
                    self.recompose_budget();
                }
                PresetAction::Delete(id) => {
                    self.shared_data.remove_preset(id);
                    self.save_shared();
                    self.recompose_budget();
                }
                PresetAction::AddToExpenses(id) => {
                    // Create expense from preset
                    if let Some(preset) = self.shared_data.get_preset(id).cloned() {
                        let expense = Expense::new(
                            preset.amount,
                            preset.category,
                            preset.description,
                            Local::now().date_naive(),
                        );
                        self.profile_data.expenses.push(expense);
                        self.save_profile();
                        self.recompose_budget();
                    }
                }
            }
        }

        // Check if drag ended outside panel (for drag-to-add)
        if self.preset_panel.is_dragging() && !ctx.input(|i| i.pointer.any_down()) {
            if let Some(preset_id) = self.preset_panel.end_drag() {
                // Drag released - add the expense
                if let Some(preset) = self.shared_data.get_preset(preset_id).cloned() {
                    let expense = Expense::new(
                        preset.amount,
                        preset.category,
                        preset.description,
                        Local::now().date_naive(),
                    );
                    self.profile_data.expenses.push(expense);
                    self.save_profile();
                    self.recompose_budget();
                }
            }
        }

        // Render profile manager modal
        let profile_actions = self.profile_manager.render(
            ctx,
            &self.config.profiles,
            &self.current_profile_id,
        );
        for action in profile_actions {
            self.handle_profile_action(action);
        }

        // Keyboard shortcuts (only when no modals are open and no text input is focused)
        let any_modal_open = self.expense_form.is_open
            || self.income_form.is_open
            || self.template_manager.is_open
            || self.category_manager.is_open
            || self.calculator.is_open
            || self.profile_manager.is_open
            || self.profile_selector.is_popup_open();

        if !any_modal_open && !ctx.wants_keyboard_input() {
            let e_pressed = ctx.input(|i| i.key_pressed(egui::Key::E));
            let t_pressed = ctx.input(|i| i.key_pressed(egui::Key::T));
            let c_pressed = ctx.input(|i| i.key_pressed(egui::Key::C));
            let p_pressed = ctx.input(|i| i.key_pressed(egui::Key::P) && !i.modifiers.command);
            let cmd_p_pressed = ctx.input(|i| i.key_pressed(egui::Key::P) && i.modifiers.command);
            let q_pressed = ctx.input(|i| i.key_pressed(egui::Key::Q));
            let i_pressed = ctx.input(|i| i.key_pressed(egui::Key::I));

            // E - Add Expense
            if e_pressed {
                self.expense_form.open();
            }
            // T - Templates
            if t_pressed {
                self.template_manager.open();
            }
            // C - Calculator
            if c_pressed {
                self.calculator.open();
            }
            // P - Switch Profiles (cycle to next profile)
            if p_pressed {
                self.cycle_to_next_profile();
            }
            // Cmd+P - Open Profile Manager
            if cmd_p_pressed {
                self.profile_manager.open();
            }
            // Q - Quick Add
            if q_pressed {
                self.preset_panel.is_open = !self.preset_panel.is_open;
            }
            // I - Edit Income
            if i_pressed {
                self.income_form.open(self.budget.income);
            }
        }

        // Bottom panel for balance bar - modern glassmorphism style
        egui::TopBottomPanel::bottom("balance_bar")
            .frame(egui::Frame::none()
                .fill(Color32::from_rgba_unmultiplied(255, 255, 255, 250))
                .inner_margin(Margin::symmetric(28.0, 20.0))
                .stroke(Stroke::new(1.0, Color32::from_rgb(230, 232, 240)))
                .shadow(egui::epaint::Shadow {
                    spread: 0.0,
                    blur: 20.0,
                    color: Color32::from_black_alpha(8),
                    offset: [0.0, -4.0].into(),
                }))
            .show(ctx, |ui| {
                render_balance_bar(ui, &self.budget);
            });

        // Use a light red background when not in the main profile
        let is_main_profile = self.current_profile_id == "main";
        let bg_color = if is_main_profile {
            Color32::from_rgb(245, 247, 250)  // Default light gray
        } else {
            Color32::from_rgb(255, 245, 245)  // Light red for other profiles
        };

        egui::CentralPanel::default()
            .frame(egui::Frame::none()
                .fill(bg_color)
                .inner_margin(Margin::same(28.0)))
            .show(ctx, |ui| {
                ui.style_mut().spacing.item_spacing = Vec2::new(12.0, 14.0);

                // Modern header with logo
                ui.horizontal(|ui| {
                    // Display logo image if loaded, otherwise fallback to text
                    if let Some(texture) = &self.logo_texture {
                        let logo_size = Vec2::new(60.0, 60.0);
                        ui.image((texture.id(), logo_size));
                        ui.add_space(8.0);
                    }
                    ui.label(egui::RichText::new("Budgetbot")
                        .font(FontId::new(32.0, FontFamily::Name("Beyonders".into())))
                        .color(Color32::from_rgb(192, 192, 192))  // Silver color
                        .strong());

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        // Quick Add button (rightmost)
                        let is_open = self.preset_panel.is_open;
                        let btn_color = if is_open {
                            Color32::from_rgb(16, 185, 129)  // Green when open
                        } else {
                            Color32::from_rgb(99, 102, 241)  // Indigo when closed
                        };
                        let btn_fill = if is_open {
                            Color32::from_rgb(236, 253, 245)  // Light green bg when open
                        } else {
                            Color32::from_rgb(238, 242, 255)  // Light indigo bg when closed
                        };
                        let btn_stroke = if is_open {
                            Color32::from_rgb(167, 243, 208)  // Green stroke when open
                        } else {
                            Color32::from_rgb(199, 210, 254)  // Indigo stroke when closed
                        };

                        let preset_btn = egui::Button::new(
                            egui::RichText::new("⚡ Quick Add")
                                .size(13.0)
                                .color(btn_color),
                        )
                        .fill(btn_fill)
                        .stroke(Stroke::new(1.0, btn_stroke))
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(100.0, 36.0));

                        if ui.add(preset_btn).on_hover_text("Keyboard shortcut: Q").clicked() {
                            self.preset_panel.toggle();
                        }

                        ui.add_space(8.0);

                        // Categories button (middle)
                        let manage_btn = egui::Button::new(
                            egui::RichText::new("⚙ Categories")
                                .size(13.0)
                                .color(Color32::from_rgb(99, 102, 241)),
                        )
                        .fill(Color32::from_rgb(238, 242, 255))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(110.0, 36.0));

                        if ui.add(manage_btn).on_hover_text("Manage expense categories").clicked() {
                            self.category_manager.open();
                        }

                        ui.add_space(8.0);

                        // Calculator button (leftmost)
                        let calc_btn = egui::Button::new(
                            egui::RichText::new("Calculator")
                                .size(13.0)
                                .color(Color32::from_rgb(99, 102, 241)),
                        )
                        .fill(Color32::from_rgb(238, 242, 255))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(100.0, 36.0));

                        if ui.add(calc_btn).on_hover_text("Keyboard shortcut: C").clicked() {
                            self.calculator.open();
                        }
                    });
                });

                ui.add_space(20.0);

                // Get available dimensions for dynamic layout
                let available_width = ui.available_width();
                let available_height = ui.available_height();
                let left_column_width = (available_width * 0.35).clamp(260.0, 340.0);
                let spacing = 28.0;
                let right_column_width = available_width - left_column_width - spacing;

                // Two-column layout
                ui.horizontal(|ui| {
                    // LEFT COLUMN - Income and Add Expense button
                    ui.vertical(|ui| {
                        ui.set_width(left_column_width);

                        // Dashboard card with subtle shadow
                        egui::Frame::none()
                            .fill(Color32::WHITE)
                            .rounding(Rounding::same(20.0))
                            .stroke(Stroke::new(1.0, Color32::from_rgb(235, 238, 245)))
                            .inner_margin(Margin::same(24.0))
                            .shadow(egui::epaint::Shadow {
                                spread: 0.0,
                                blur: 15.0,
                                color: Color32::from_black_alpha(6),
                                offset: [0.0, 4.0].into(),
                            })
                            .show(ui, |ui| {
                                if render_dashboard(ui, &self.budget) {
                                    self.income_form.open(self.budget.income);
                                }
                            });

                        ui.add_space(20.0);

                        // Add Expense button - matching Edit button style
                        ui.vertical_centered(|ui| {
                            let expense_btn = egui::Button::new(
                                egui::RichText::new("+ Add Expense")
                                    .color(Color32::from_rgb(99, 102, 241))
                                    .size(15.0)
                                    .strong()
                            )
                            .fill(Color32::from_rgb(238, 242, 255))
                            .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
                            .rounding(Rounding::same(14.0))
                            .min_size(Vec2::new(left_column_width - 8.0, 50.0));

                            if ui.add(expense_btn).on_hover_text("Keyboard shortcut: E").clicked() {
                                self.expense_form.open();
                            }
                        });

                        ui.add_space(12.0);

                        // Templates button - matching Edit button style
                        ui.vertical_centered(|ui| {
                            let template_btn = egui::Button::new(
                                egui::RichText::new("Templates")
                                    .color(Color32::from_rgb(99, 102, 241))
                                    .size(15.0)
                                    .strong()
                            )
                            .fill(Color32::from_rgb(238, 242, 255))
                            .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
                            .rounding(Rounding::same(14.0))
                            .min_size(Vec2::new(left_column_width - 8.0, 50.0));

                            if ui.add(template_btn).on_hover_text("Keyboard shortcut: T").clicked() {
                                self.template_manager.open();
                            }
                        });

                        ui.add_space(12.0);

                        // Profile selector dropdown
                        ui.vertical_centered(|ui| {
                            if let Some(action) = self.profile_selector.render(
                                ui,
                                &self.config.profiles,
                                &self.current_profile_id,
                                left_column_width - 8.0,
                            ) {
                                match action {
                                    ProfileSelectorAction::SwitchProfile(id) => {
                                        self.switch_profile(&id);
                                    }
                                    ProfileSelectorAction::OpenManager => {
                                        self.profile_manager.open();
                                    }
                                }
                            }
                        });
                    });

                    ui.add_space(spacing);

                    // RIGHT COLUMN - Expenses list with modern card
                    ui.vertical(|ui| {
                        ui.set_width(right_column_width);
                        ui.set_min_height(available_height);

                        egui::Frame::none()
                            .fill(Color32::WHITE)
                            .rounding(Rounding::same(20.0))
                            .stroke(Stroke::new(1.0, Color32::from_rgb(235, 238, 245)))
                            .inner_margin(Margin::same(24.0))
                            .shadow(egui::epaint::Shadow {
                                spread: 0.0,
                                blur: 15.0,
                                color: Color32::from_black_alpha(6),
                                offset: [0.0, 4.0].into(),
                            })
                            .show(ui, |ui| {
                                // Header - always visible outside scroll area
                                render_expenses_header(ui, self.budget.expenses.len());

                                let scroll_height = available_height - 180.0; // Account for header and total line

                                egui::ScrollArea::vertical()
                                    .max_height(scroll_height.max(150.0))
                                    .auto_shrink([false, false])
                                    .show(ui, |ui| {
                                        if let Some(action) = render_expenses(ui, &mut self.budget) {
                                            match action {
                                                HistoryAction::DeleteExpense(id) => {
                                                    self.profile_data.expenses.retain(|e| e.id != id);
                                                    self.save_profile();
                                                    self.recompose_budget();
                                                }
                                                HistoryAction::ToggleExpense(id) => {
                                                    if let Some(exp) = self.profile_data.expenses.iter_mut().find(|e| e.id == id) {
                                                        exp.active = !exp.active;
                                                    }
                                                    self.save_profile();
                                                    self.recompose_budget();
                                                }
                                                HistoryAction::SaveAsPreset(id) => {
                                                    // Open preset panel with expense data pre-filled
                                                    if let Some(expense) = self.profile_data.expenses.iter().find(|e| e.id == id) {
                                                        let name = if expense.description.is_empty() {
                                                            expense.category.clone()
                                                        } else {
                                                            expense.description.clone()
                                                        };
                                                        self.preset_panel.init_from_expense(
                                                            name,
                                                            expense.amount,
                                                            expense.category.clone(),
                                                            expense.description.clone(),
                                                        );
                                                    }
                                                }
                                            }
                                        }
                                    });

                                // Total line - always visible at bottom of card
                                ui.add_space(12.0);
                                ui.separator();
                                ui.add_space(8.0);
                                ui.horizontal(|ui| {
                                    ui.label(
                                        egui::RichText::new("Total Expenses")
                                            .size(14.0)
                                            .color(Color32::from_rgb(107, 114, 128))
                                            .strong(),
                                    );
                                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                                        ui.label(
                                            egui::RichText::new(format!("-${:.2}", self.budget.total_expenses()))
                                                .size(16.0)
                                                .color(Color32::from_rgb(239, 68, 68))
                                                .strong(),
                                        );
                                    });
                                });
                            });
                    });
                });
            });
    }
}
