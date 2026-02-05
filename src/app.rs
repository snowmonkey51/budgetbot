use eframe::egui::{self, Color32, FontId, Margin, Rounding, Stroke, Vec2};

use crate::models::Budget;
use crate::storage::{load_budget, save_budget};
use crate::ui::{render_balance_bar, render_dashboard, render_expenses, Calculator, CategoryAction, CategoryManager, ExpenseForm, HistoryAction, IncomeForm};

pub struct BudgetApp {
    budget: Budget,
    expense_form: ExpenseForm,
    income_form: IncomeForm,
    category_manager: CategoryManager,
    calculator: Calculator,
}

impl BudgetApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        configure_styles(&cc.egui_ctx);
        let budget = load_budget();
        Self {
            budget,
            expense_form: ExpenseForm::new(),
            income_form: IncomeForm::new(),
            category_manager: CategoryManager::new(),
            calculator: Calculator::new(),
        }
    }

    fn save(&mut self) {
        let _ = save_budget(&self.budget);
    }
}

fn configure_styles(ctx: &egui::Context) {
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
        let actions = self.category_manager.render(ctx, &self.budget.categories, &self.budget.category_colors);
        for action in actions {
            match action {
                CategoryAction::Add(name, color) => {
                    self.budget.add_category_with_color(name, color);
                    self.save();
                }
                CategoryAction::Delete(name) => {
                    self.budget.remove_category(&name);
                    self.save();
                }
                CategoryAction::UpdateColor(name, color) => {
                    self.budget.set_category_color(&name, color);
                    self.save();
                }
            }
        }

        // Render expense form popup window
        let (expense, new_cat) = self.expense_form.render(
            ctx,
            &self.budget.categories,
            &self.budget.category_colors,
        );
        if let Some((cat_name, cat_color)) = new_cat {
            self.budget.add_category_with_color(cat_name, cat_color);
            self.save();
        }
        if let Some(exp) = expense {
            self.budget.add_expense(exp);
            self.save();
        }

        // Render income form popup window
        if let Some(new_income) = self.income_form.render(ctx) {
            self.budget.set_income(new_income);
            self.save();
        }

        // Render calculator popup window
        self.calculator.render(ctx);

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

        egui::CentralPanel::default()
            .frame(egui::Frame::none()
                .fill(Color32::from_rgb(245, 247, 250))
                .inner_margin(Margin::same(28.0)))
            .show(ctx, |ui| {
                ui.style_mut().spacing.item_spacing = Vec2::new(12.0, 14.0);

                // Modern header with gradient-style text
                ui.horizontal(|ui| {
                    ui.label(egui::RichText::new("[°_°] Budgetbot")
                        .font(FontId::proportional(32.0))
                        .color(Color32::from_rgb(17, 24, 39))
                        .strong());

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        let manage_btn = egui::Button::new(
                            egui::RichText::new("⚙ Categories")
                                .size(13.0)
                                .color(Color32::WHITE)
                                .strong(),
                        )
                        .fill(Color32::from_rgb(99, 102, 241))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(110.0, 36.0));

                        if ui.add(manage_btn).clicked() {
                            self.category_manager.open();
                        }

                        ui.add_space(8.0);

                        let calc_btn = egui::Button::new(
                            egui::RichText::new("Calculator")
                                .size(13.0)
                                .color(Color32::WHITE)
                                .strong(),
                        )
                        .fill(Color32::from_rgb(16, 185, 129))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(100.0, 36.0));

                        if ui.add(calc_btn).clicked() {
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

                        // Modern gradient-style Add Expense button - centered
                        ui.vertical_centered(|ui| {
                            let expense_btn = egui::Button::new(
                                egui::RichText::new("+ Add Expense")
                                    .color(Color32::WHITE)
                                    .size(15.0)
                                    .strong()
                            )
                            .fill(Color32::from_rgb(239, 68, 68))
                            .stroke(Stroke::NONE)
                            .rounding(Rounding::same(14.0))
                            .min_size(Vec2::new(left_column_width - 8.0, 50.0));

                            if ui.add(expense_btn).clicked() {
                                self.expense_form.open();
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
                                let scroll_height = available_height - 140.0; // Account for total line

                                egui::ScrollArea::vertical()
                                    .max_height(scroll_height.max(150.0))
                                    .auto_shrink([false, false])
                                    .show(ui, |ui| {
                                        if let Some(action) = render_expenses(ui, &mut self.budget) {
                                            match action {
                                                HistoryAction::DeleteExpense(id) => {
                                                    self.budget.remove_expense(id);
                                                    self.save();
                                                }
                                                HistoryAction::ToggleExpense(id) => {
                                                    self.budget.toggle_expense_active(id);
                                                    self.save();
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
