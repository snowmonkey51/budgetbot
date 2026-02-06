use egui::{Color32, ComboBox, Margin, Pos2, RichText, Rounding, Stroke, TextEdit, Vec2};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::{CategoryColor, ExpensePreset};

pub enum PresetAction {
    Create(ExpensePreset),
    Delete(Uuid),
    #[allow(dead_code)]
    AddToExpenses(Uuid), // Add preset as expense (via drag - kept for potential future use)
}

pub struct PresetPanel {
    pub is_open: bool,
    // Drag state
    dragging_preset_id: Option<Uuid>,
    drag_start_pos: Option<Pos2>,
    drag_confirmed: bool, // Only true once drag moved enough distance
    // New preset form
    show_new_form: bool,
    new_name: String,
    new_amount: String,
    new_category: String,
    new_description: String,
    new_day: String,
}

impl Default for PresetPanel {
    fn default() -> Self {
        Self::new()
    }
}

impl PresetPanel {
    pub fn new() -> Self {
        Self {
            is_open: false,
            dragging_preset_id: None,
            drag_start_pos: None,
            drag_confirmed: false,
            show_new_form: false,
            new_name: String::new(),
            new_amount: String::new(),
            new_category: String::new(),
            new_description: String::new(),
            new_day: String::new(),
        }
    }

    pub fn toggle(&mut self) {
        self.is_open = !self.is_open;
        if !self.is_open {
            self.clear_form();
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.clear_form();
    }

    fn clear_form(&mut self) {
        self.show_new_form = false;
        self.new_name.clear();
        self.new_amount.clear();
        self.new_category.clear();
        self.new_description.clear();
        self.new_day.clear();
    }

    /// Returns true if currently dragging a preset (and moved enough to confirm)
    pub fn is_dragging(&self) -> bool {
        self.dragging_preset_id.is_some() && self.drag_confirmed
    }

    /// Get the ID of the preset being dragged, if any
    pub fn dragging_id(&self) -> Option<Uuid> {
        self.dragging_preset_id
    }

    /// Call this when a drag ends outside the panel to potentially add expense
    pub fn end_drag(&mut self) -> Option<Uuid> {
        let was_confirmed = self.drag_confirmed;
        self.drag_confirmed = false;
        if was_confirmed {
            self.dragging_preset_id.take()
        } else {
            self.dragging_preset_id = None;
            None
        }
    }

    /// Initialize form with values from an expense (for "Save as Preset")
    pub fn init_from_expense(&mut self, name: String, amount: f64, category: String, description: String) {
        self.is_open = true;
        self.show_new_form = true;
        self.new_name = name;
        self.new_amount = format!("{:.2}", amount);
        self.new_category = category;
        self.new_description = description;
        self.new_day.clear();
    }

    pub fn render(
        &mut self,
        ctx: &egui::Context,
        presets: &[ExpensePreset],
        categories: &[String],
        category_colors: &HashMap<String, CategoryColor>,
    ) -> Vec<PresetAction> {
        let mut actions: Vec<PresetAction> = Vec::new();

        if !self.is_open {
            return actions;
        }

        // Check if we should confirm the drag (moved enough distance)
        if self.dragging_preset_id.is_some() && !self.drag_confirmed {
            if let (Some(start), Some(current)) = (self.drag_start_pos, ctx.pointer_latest_pos()) {
                let distance = (current - start).length();
                if distance > 10.0 {
                    self.drag_confirmed = true;
                }
            }
        }

        // Render floating drag preview only if drag is confirmed
        if self.drag_confirmed {
            if let Some(preset_id) = self.dragging_preset_id {
                if let Some(preset) = presets.iter().find(|p| p.id == preset_id) {
                    self.render_drag_preview(ctx, preset, category_colors);
                }
            }
        }

        // Use a Window anchored to the right side so it overlays without pushing content
        egui::Window::new("Quick Add")
            .title_bar(false)
            .resizable(false)
            .collapsible(false)
            .anchor(egui::Align2::RIGHT_TOP, [-10.0, 80.0])  // Offset from top-right, below header
            .fixed_size([220.0, 500.0])
            .frame(
                egui::Frame::none()
                    .fill(Color32::WHITE)
                    .rounding(Rounding::same(16.0))
                    .stroke(Stroke::new(1.0, Color32::from_rgb(235, 238, 245)))
                    .inner_margin(Margin::same(16.0))
                    .shadow(egui::epaint::Shadow {
                        spread: 0.0,
                        blur: 20.0,
                        color: Color32::from_black_alpha(15),
                        offset: [-4.0, 4.0].into(),
                    }),
            )
            .show(ctx, |ui| {
                ui.vertical(|ui| {
                    // Header
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Quick Add")
                                .size(16.0)
                                .color(Color32::from_rgb(17, 24, 39))
                                .strong(),
                        );

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let close_btn = egui::Button::new(
                                RichText::new("X")
                                    .size(14.0)
                                    .color(Color32::from_rgb(156, 163, 175)),
                            )
                            .fill(Color32::TRANSPARENT)
                            .stroke(Stroke::NONE);

                            if ui.add(close_btn).clicked() {
                                self.close();
                            }
                        });
                    });

                    ui.add_space(4.0);
                    ui.label(
                        RichText::new("Drag to expenses to add")
                            .size(11.0)
                            .color(Color32::from_rgb(156, 163, 175)),
                    );

                    ui.add_space(12.0);

                    // Presets list
                    egui::ScrollArea::vertical()
                        .max_height(ui.available_height() - 60.0)
                        .show(ui, |ui| {
                            ui.spacing_mut().item_spacing = Vec2::new(6.0, 8.0);

                            if presets.is_empty() && !self.show_new_form {
                                ui.vertical_centered(|ui| {
                                    ui.add_space(30.0);
                                    ui.label(
                                        RichText::new("No presets yet")
                                            .size(13.0)
                                            .color(Color32::from_rgb(156, 163, 175)),
                                    );
                                    ui.add_space(8.0);
                                    ui.label(
                                        RichText::new("Create presets for expenses\nyou add frequently")
                                            .size(11.0)
                                            .color(Color32::from_rgb(180, 180, 190)),
                                    );
                                    ui.add_space(30.0);
                                });
                            }

                            // Collect preset IDs to delete (can't modify while iterating)
                            let mut preset_to_delete: Option<Uuid> = None;

                            for preset in presets {
                                // Use category color
                                let display_color = category_colors
                                    .get(&preset.category)
                                    .copied()
                                    .unwrap_or([156, 163, 175]);

                                let is_being_dragged = self.dragging_preset_id == Some(preset.id);
                                let bg_alpha = if is_being_dragged { 100 } else { 255 };

                                let bg_color = Color32::from_rgba_unmultiplied(
                                    250 - (250 - display_color[0]) / 10,
                                    250 - (250 - display_color[1]) / 10,
                                    250 - (250 - display_color[2]) / 10,
                                    bg_alpha,
                                );

                                let preset_id = preset.id;

                                // Allocate the full size for the preset item first for drag detection
                                let item_id = ui.id().with(("preset_item", preset.id));
                                let desired_size = Vec2::new(ui.available_width(), 56.0);
                                let (item_rect, item_response) = ui.allocate_exact_size(desired_size, egui::Sense::drag());

                                // Draw the frame background
                                ui.painter().rect_filled(
                                    item_rect,
                                    Rounding::same(10.0),
                                    bg_color,
                                );
                                ui.painter().rect_stroke(
                                    item_rect,
                                    Rounding::same(10.0),
                                    Stroke::new(1.0, Color32::from_rgb(235, 238, 245)),
                                );

                                // Create a child UI for the content
                                let content_rect = item_rect.shrink2(Vec2::new(12.0, 10.0));
                                let mut content_ui = ui.new_child(egui::UiBuilder::new().max_rect(content_rect));

                                content_ui.horizontal(|ui| {
                                    // Color indicator - use display_color
                                    let color = Color32::from_rgb(display_color[0], display_color[1], display_color[2]);
                                    let (rect, _) = ui.allocate_exact_size(Vec2::new(4.0, 36.0), egui::Sense::hover());
                                    ui.painter().rect_filled(rect, Rounding::same(2.0), color);
                                    ui.add_space(8.0);

                                    ui.vertical(|ui| {
                                        ui.set_min_width(100.0);

                                        // Preset name with optional day indicator
                                        ui.horizontal(|ui| {
                                            ui.label(
                                                RichText::new(&preset.name)
                                                    .size(13.0)
                                                    .color(Color32::from_rgb(17, 24, 39))
                                                    .strong(),
                                            );
                                            if let Some(day) = preset.default_day {
                                                ui.label(
                                                    RichText::new(format!("({})", day))
                                                        .size(10.0)
                                                        .color(Color32::from_rgb(156, 163, 175)),
                                                );
                                            }
                                        });

                                        // Amount and category
                                        ui.horizontal(|ui| {
                                            ui.label(
                                                RichText::new(format!("${:.2}", preset.amount))
                                                    .size(11.0)
                                                    .color(Color32::from_rgb(107, 114, 128)),
                                            );
                                            ui.label(
                                                RichText::new("·")
                                                    .size(11.0)
                                                    .color(Color32::from_rgb(180, 180, 190)),
                                            );
                                            ui.label(
                                                RichText::new(&preset.category)
                                                    .size(10.0)
                                                    .color(Color32::from_rgb(display_color[0], display_color[1], display_color[2])),
                                            );
                                        });
                                    });

                                    ui.with_layout(
                                        egui::Layout::right_to_left(egui::Align::Center),
                                        |ui| {
                                            // Delete button - uses click sense which takes priority
                                            let del_btn = egui::Button::new(
                                                RichText::new("X")
                                                    .size(10.0)
                                                    .color(Color32::from_rgb(180, 180, 190)),
                                            )
                                            .fill(Color32::TRANSPARENT)
                                            .stroke(Stroke::NONE)
                                            .min_size(Vec2::new(20.0, 20.0))
                                            .sense(egui::Sense::click()); // Explicit click sense

                                            if ui.add(del_btn).clicked() {
                                                preset_to_delete = Some(preset_id);
                                            }
                                        },
                                    );
                                });

                                // Handle drag on the item (only if not clicking delete)
                                if preset_to_delete.is_none() {
                                    if item_response.drag_started() {
                                        self.dragging_preset_id = Some(preset.id);
                                        self.drag_start_pos = ctx.pointer_latest_pos();
                                    }
                                }
                            }

                            // Handle delete after the loop
                            if let Some(id) = preset_to_delete {
                                actions.push(PresetAction::Delete(id));
                            }

                            // New preset form (inline)
                            if self.show_new_form {
                                ui.add_space(8.0);
                                self.render_new_preset_form(ui, categories, &mut actions);
                            }
                        });

                    ui.add_space(8.0);

                    // Add new preset button
                    if !self.show_new_form {
                        let add_btn = egui::Button::new(
                            RichText::new("+ New Preset")
                                .size(13.0)
                                .color(Color32::from_rgb(99, 102, 241)),
                        )
                        .fill(Color32::from_rgb(238, 242, 255))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
                        .rounding(Rounding::same(10.0))
                        .min_size(Vec2::new(ui.available_width(), 38.0));

                        if ui.add(add_btn).clicked() {
                            self.show_new_form = true;
                            if !categories.is_empty() && self.new_category.is_empty() {
                                self.new_category = categories[0].clone();
                            }
                        }
                    }
                });
            });

        // Handle drag release - if not confirmed, cancel it
        if self.dragging_preset_id.is_some() && !ctx.input(|i| i.pointer.any_down()) {
            if !self.drag_confirmed {
                // Was just a click, not a real drag - cancel
                self.dragging_preset_id = None;
                self.drag_start_pos = None;
            }
            // If confirmed, keep the ID so the caller can check and handle it
        }

        actions
    }

    fn render_new_preset_form(
        &mut self,
        ui: &mut egui::Ui,
        categories: &[String],
        actions: &mut Vec<PresetAction>,
    ) {
        egui::Frame::none()
            .fill(Color32::from_rgb(249, 250, 251))
            .rounding(Rounding::same(10.0))
            .stroke(Stroke::new(1.0, Color32::from_rgb(229, 231, 235)))
            .inner_margin(Margin::same(12.0))
            .show(ui, |ui| {
                ui.vertical(|ui| {
                    ui.label(
                        RichText::new("New Preset")
                            .size(12.0)
                            .color(Color32::from_rgb(107, 114, 128))
                            .strong(),
                    );
                    ui.add_space(8.0);

                    // Name field
                    ui.add(
                        TextEdit::singleline(&mut self.new_name)
                            .desired_width(ui.available_width())
                            .hint_text("Name (e.g., Netflix)"),
                    );
                    ui.add_space(6.0);

                    // Amount field
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("$")
                                .size(14.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        );
                        ui.add(
                            TextEdit::singleline(&mut self.new_amount)
                                .desired_width(ui.available_width() - 20.0)
                                .hint_text("0.00"),
                        );
                    });
                    ui.add_space(6.0);

                    // Category dropdown
                    if !categories.is_empty() {
                        if self.new_category.is_empty() {
                            self.new_category = categories[0].clone();
                        }

                        ComboBox::from_id_salt("new_preset_category")
                            .width(ui.available_width())
                            .selected_text(&self.new_category)
                            .show_ui(ui, |ui| {
                                for cat in categories {
                                    ui.selectable_value(&mut self.new_category, cat.clone(), cat);
                                }
                            });
                    }
                    ui.add_space(6.0);

                    // Description field
                    ui.add(
                        TextEdit::singleline(&mut self.new_description)
                            .desired_width(ui.available_width())
                            .hint_text("Description (optional)"),
                    );
                    ui.add_space(6.0);

                    // Day of month picker
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Day")
                                .size(11.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        );
                        ui.add(
                            TextEdit::singleline(&mut self.new_day)
                                .desired_width(50.0)
                                .hint_text("1-31"),
                        );
                        ui.label(
                            RichText::new("(optional)")
                                .size(10.0)
                                .color(Color32::from_rgb(156, 163, 175)),
                        );
                    });
                    ui.add_space(10.0);

                    // Buttons
                    ui.horizontal(|ui| {
                        let cancel_btn = egui::Button::new(
                            RichText::new("Cancel")
                                .size(12.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        )
                        .fill(Color32::from_rgb(243, 244, 246))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(8.0))
                        .min_size(Vec2::new(70.0, 32.0));

                        if ui.add(cancel_btn).clicked() {
                            self.clear_form();
                        }

                        ui.add_space(6.0);

                        let can_save = !self.new_name.trim().is_empty()
                            && !self.new_amount.is_empty()
                            && self.new_amount.parse::<f64>().map(|v| v > 0.0).unwrap_or(false)
                            && !self.new_category.is_empty();

                        let save_btn = egui::Button::new(
                            RichText::new("Save")
                                .size(12.0)
                                .color(if can_save { Color32::WHITE } else { Color32::from_rgb(180, 180, 180) })
                                .strong(),
                        )
                        .fill(if can_save { Color32::from_rgb(16, 185, 129) } else { Color32::from_rgb(220, 220, 225) })
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(8.0))
                        .min_size(Vec2::new(70.0, 32.0));

                        if ui.add(save_btn).clicked() && can_save {
                            if let Ok(amount) = self.new_amount.parse::<f64>() {
                                let mut preset = ExpensePreset::new(
                                    self.new_name.trim().to_string(),
                                    amount,
                                    self.new_category.clone(),
                                    self.new_description.clone(),
                                );
                                // Add default day if valid
                                if let Ok(day) = self.new_day.parse::<u32>() {
                                    if (1..=31).contains(&day) {
                                        preset = preset.with_day(day);
                                    }
                                }
                                actions.push(PresetAction::Create(preset));
                                self.clear_form();
                            }
                        }
                    });
                });
            });
    }

    fn render_drag_preview(
        &self,
        ctx: &egui::Context,
        preset: &ExpensePreset,
        category_colors: &HashMap<String, CategoryColor>,
    ) {
        if let Some(pos) = ctx.pointer_latest_pos() {
            // Use category color
            let display_color = category_colors
                .get(&preset.category)
                .copied()
                .unwrap_or([156, 163, 175]);

            // Render a floating preview at cursor position
            egui::Area::new(egui::Id::new("preset_drag_preview"))
                .fixed_pos(pos + Vec2::new(10.0, 10.0))
                .order(egui::Order::Tooltip)
                .show(ctx, |ui| {
                    egui::Frame::none()
                        .fill(Color32::from_rgba_unmultiplied(255, 255, 255, 240))
                        .rounding(Rounding::same(8.0))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(display_color[0], display_color[1], display_color[2])))
                        .inner_margin(Margin::symmetric(10.0, 8.0))
                        .shadow(egui::epaint::Shadow {
                            spread: 2.0,
                            blur: 10.0,
                            color: Color32::from_black_alpha(30),
                            offset: [0.0, 4.0].into(),
                        })
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                ui.label(
                                    RichText::new(&preset.name)
                                        .size(12.0)
                                        .color(Color32::from_rgb(17, 24, 39))
                                        .strong(),
                                );
                                ui.label(
                                    RichText::new(format!("${:.2}", preset.amount))
                                        .size(11.0)
                                        .color(Color32::from_rgb(107, 114, 128)),
                                );
                            });
                        });
                });
        }
    }
}
