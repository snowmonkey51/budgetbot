use egui::{Color32, Margin, RichText, Rounding, Stroke, TextEdit, Ui, Vec2};
use std::collections::HashMap;

use crate::models::CategoryColor;

/// Preset colors for the color picker
const COLOR_PRESETS: &[[u8; 3]] = &[
    [239, 68, 68],    // Red
    [249, 115, 22],   // Orange
    [245, 158, 11],   // Amber
    [234, 179, 8],    // Yellow
    [132, 204, 22],   // Lime
    [34, 197, 94],    // Green
    [20, 184, 166],   // Teal
    [6, 182, 212],    // Cyan
    [59, 130, 246],   // Blue
    [99, 102, 241],   // Indigo
    [168, 85, 247],   // Purple
    [236, 72, 153],   // Pink
    [156, 163, 175],  // Gray
    [107, 114, 128],  // Dark Gray
];

pub enum CategoryAction {
    Add(String, CategoryColor),
    Delete(String),
    UpdateColor(String, CategoryColor),
}

pub struct CategoryManager {
    pub is_open: bool,
    new_category_input: String,
    new_category_color: CategoryColor,
    color_picker_open_for: Option<String>, // None = new category, Some(name) = existing category
}

impl Default for CategoryManager {
    fn default() -> Self {
        Self::new()
    }
}

impl CategoryManager {
    pub fn new() -> Self {
        Self {
            is_open: false,
            new_category_input: String::new(),
            new_category_color: [59, 130, 246], // Default blue
            color_picker_open_for: None,
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
        self.new_category_input.clear();
        self.new_category_color = [59, 130, 246];
        self.color_picker_open_for = None;
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.new_category_input.clear();
        self.color_picker_open_for = None;
    }

    pub fn render(
        &mut self,
        ctx: &egui::Context,
        categories: &[String],
        category_colors: &HashMap<String, CategoryColor>,
    ) -> Vec<CategoryAction> {
        let mut actions: Vec<CategoryAction> = Vec::new();

        if !self.is_open {
            return actions;
        }

        egui::Window::new("Manage Categories")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([380.0, 480.0])
            .frame(egui::Frame::none()
                .fill(Color32::WHITE)
                .rounding(Rounding::same(16.0))
                .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                .inner_margin(Margin::same(24.0))
                .shadow(egui::epaint::Shadow {
                    spread: 8.0,
                    blur: 20.0,
                    color: Color32::from_black_alpha(25),
                    offset: [0.0, 4.0].into(),
                }))
            .show(ctx, |ui| {
                ui.vertical(|ui| {
                    // Header
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Manage Categories")
                                .size(18.0)
                                .color(Color32::from_rgb(30, 30, 40))
                                .strong(),
                        );

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let close_btn = egui::Button::new(
                                RichText::new("×").size(20.0).color(Color32::from_rgb(120, 120, 130)),
                            )
                            .fill(Color32::TRANSPARENT)
                            .stroke(Stroke::NONE);

                            if ui.add(close_btn).clicked() {
                                self.close();
                            }
                        });
                    });

                    ui.add_space(16.0);

                    // Add new category section
                    ui.label(
                        RichText::new("Add New Category")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(4.0);

                    ui.horizontal(|ui| {
                        // Color swatch with dropdown
                        let color = Color32::from_rgb(
                            self.new_category_color[0],
                            self.new_category_color[1],
                            self.new_category_color[2],
                        );
                        let (rect, response) = ui.allocate_exact_size(Vec2::splat(28.0), egui::Sense::click());
                        ui.painter().rect_filled(rect, Rounding::same(6.0), color);
                        ui.painter().rect_stroke(rect, Rounding::same(6.0), Stroke::new(1.0, Color32::from_rgb(200, 200, 210)));

                        if response.clicked() {
                            self.color_picker_open_for = if self.color_picker_open_for == Some("__new__".to_string()) {
                                None
                            } else {
                                Some("__new__".to_string())
                            };
                        }
                        response.on_hover_text("Click to choose color");

                        let text_response = ui.add(
                            TextEdit::singleline(&mut self.new_category_input)
                                .desired_width(180.0)
                                .hint_text("Category name"),
                        );

                        let add_btn = egui::Button::new(
                            RichText::new("Add").color(Color32::WHITE).size(13.0),
                        )
                        .fill(Color32::from_rgb(59, 130, 246))
                        .rounding(Rounding::same(6.0))
                        .min_size(Vec2::new(60.0, 30.0));

                        let should_add = ui.add(add_btn).clicked()
                            || (text_response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)));

                        if should_add && !self.new_category_input.trim().is_empty() {
                            actions.push(CategoryAction::Add(
                                self.new_category_input.clone(),
                                self.new_category_color,
                            ));
                            self.new_category_input.clear();
                            self.new_category_color = [59, 130, 246];
                            self.color_picker_open_for = None;
                        }
                    });

                    // Color picker for new category
                    if self.color_picker_open_for == Some("__new__".to_string()) {
                        ui.add_space(8.0);
                        egui::Frame::none()
                            .fill(Color32::from_rgb(250, 250, 252))
                            .rounding(Rounding::same(8.0))
                            .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                            .inner_margin(Margin::same(10.0))
                            .show(ui, |ui| {
                                ui.horizontal_wrapped(|ui| {
                                    ui.spacing_mut().item_spacing = Vec2::new(6.0, 6.0);
                                    for preset in COLOR_PRESETS {
                                        let preset_color = Color32::from_rgb(preset[0], preset[1], preset[2]);
                                        let is_selected = *preset == self.new_category_color;
                                        let (rect, response) = ui.allocate_exact_size(Vec2::splat(28.0), egui::Sense::click());
                                        ui.painter().rect_filled(rect, Rounding::same(6.0), preset_color);
                                        if is_selected {
                                            ui.painter().rect_stroke(rect, Rounding::same(6.0), Stroke::new(2.5, Color32::from_rgb(30, 30, 40)));
                                        } else {
                                            ui.painter().rect_stroke(rect, Rounding::same(6.0), Stroke::new(1.0, preset_color.gamma_multiply(0.7)));
                                        }
                                        if response.clicked() {
                                            self.new_category_color = *preset;
                                            self.color_picker_open_for = None;
                                        }
                                    }
                                });
                            });
                    }

                    ui.add_space(20.0);

                    // Existing categories list
                    ui.label(
                        RichText::new("Existing Categories")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(8.0);

                    egui::ScrollArea::vertical()
                        .max_height(280.0)
                        .show(ui, |ui| {
                            ui.spacing_mut().item_spacing = Vec2::new(8.0, 6.0);

                            if categories.is_empty() {
                                ui.label(
                                    RichText::new("No categories yet")
                                        .size(13.0)
                                        .color(Color32::from_rgb(150, 150, 160)),
                                );
                            } else {
                                for category in categories {
                                    let cat_color = category_colors
                                        .get(category)
                                        .copied()
                                        .unwrap_or([156, 163, 175]);
                                    let bg_color = Color32::from_rgb(cat_color[0], cat_color[1], cat_color[2]);
                                    let is_picker_open = self.color_picker_open_for == Some(category.clone());

                                    egui::Frame::none()
                                        .fill(bg_color.gamma_multiply(0.15))
                                        .rounding(Rounding::same(8.0))
                                        .stroke(Stroke::new(1.0, bg_color.gamma_multiply(0.3)))
                                        .inner_margin(Margin::symmetric(12.0, 10.0))
                                        .show(ui, |ui| {
                                            ui.vertical(|ui| {
                                                ui.horizontal(|ui| {
                                                    // Color picker button
                                                    let (rect, response) = ui.allocate_exact_size(Vec2::splat(24.0), egui::Sense::click());
                                                    ui.painter().rect_filled(rect, Rounding::same(4.0), bg_color);
                                                    ui.painter().rect_stroke(rect, Rounding::same(4.0), Stroke::new(1.0, bg_color.gamma_multiply(0.7)));

                                                    if response.clicked() {
                                                        self.color_picker_open_for = if is_picker_open {
                                                            None
                                                        } else {
                                                            Some(category.clone())
                                                        };
                                                    }
                                                    response.on_hover_text("Click to choose color");

                                                    ui.add_space(8.0);

                                                    ui.label(
                                                        RichText::new(category)
                                                            .size(13.0)
                                                            .color(Color32::from_rgb(50, 50, 60)),
                                                    );

                                                    ui.with_layout(
                                                        egui::Layout::right_to_left(egui::Align::Center),
                                                        |ui| {
                                                            let del_btn = egui::Button::new(
                                                                RichText::new("Delete")
                                                                    .size(11.0)
                                                                    .color(Color32::from_rgb(220, 38, 38)),
                                                            )
                                                            .fill(Color32::from_rgb(254, 242, 242))
                                                            .stroke(Stroke::new(1.0, Color32::from_rgb(254, 202, 202)))
                                                            .rounding(Rounding::same(4.0));

                                                            if ui.add(del_btn).clicked() {
                                                                actions.push(CategoryAction::Delete(category.clone()));
                                                            }
                                                        },
                                                    );
                                                });

                                                // Color picker dropdown for this category
                                                if is_picker_open {
                                                    ui.add_space(8.0);
                                                    egui::Frame::none()
                                                        .fill(Color32::from_rgb(255, 255, 255))
                                                        .rounding(Rounding::same(6.0))
                                                        .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                                                        .inner_margin(Margin::same(8.0))
                                                        .show(ui, |ui| {
                                                            ui.horizontal_wrapped(|ui| {
                                                                ui.spacing_mut().item_spacing = Vec2::new(5.0, 5.0);
                                                                for preset in COLOR_PRESETS {
                                                                    let preset_color = Color32::from_rgb(preset[0], preset[1], preset[2]);
                                                                    let is_selected = *preset == cat_color;
                                                                    let (rect, response) = ui.allocate_exact_size(Vec2::splat(24.0), egui::Sense::click());
                                                                    ui.painter().rect_filled(rect, Rounding::same(4.0), preset_color);
                                                                    if is_selected {
                                                                        ui.painter().rect_stroke(rect, Rounding::same(4.0), Stroke::new(2.5, Color32::from_rgb(30, 30, 40)));
                                                                    } else {
                                                                        ui.painter().rect_stroke(rect, Rounding::same(4.0), Stroke::new(1.0, preset_color.gamma_multiply(0.7)));
                                                                    }
                                                                    if response.clicked() {
                                                                        actions.push(CategoryAction::UpdateColor(category.clone(), *preset));
                                                                        self.color_picker_open_for = None;
                                                                    }
                                                                }
                                                            });
                                                        });
                                                }
                                            });
                                        });
                                }
                            }
                        });
                });
            });

        actions
    }
}

/// Renders a small "add category" popup inline
pub struct AddCategoryPopup {
    pub is_open: bool,
    input: String,
    color: CategoryColor,
}

impl Default for AddCategoryPopup {
    fn default() -> Self {
        Self::new()
    }
}

impl AddCategoryPopup {
    pub fn new() -> Self {
        Self {
            is_open: false,
            input: String::new(),
            color: [156, 163, 175], // Default gray
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
        self.input.clear();
        self.color = [156, 163, 175];
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.input.clear();
    }

    /// Returns (category_name, color) if one was added
    pub fn render(&mut self, ui: &mut Ui) -> Option<(String, CategoryColor)> {
        if !self.is_open {
            return None;
        }

        let mut result: Option<(String, CategoryColor)> = None;

        egui::Frame::none()
            .fill(Color32::from_rgb(248, 250, 252))
            .rounding(Rounding::same(8.0))
            .stroke(Stroke::new(1.0, Color32::from_rgb(59, 130, 246).gamma_multiply(0.4)))
            .inner_margin(Margin::same(12.0))
            .show(ui, |ui| {
                ui.label(
                    RichText::new("New Category")
                        .size(12.0)
                        .color(Color32::from_rgb(100, 100, 110)),
                );
                ui.add_space(4.0);

                ui.horizontal(|ui| {
                    // Color swatch
                    let color = Color32::from_rgb(self.color[0], self.color[1], self.color[2]);
                    let (rect, response) = ui.allocate_exact_size(Vec2::splat(24.0), egui::Sense::click());
                    ui.painter().rect_filled(rect, Rounding::same(4.0), color);
                    ui.painter().rect_stroke(rect, Rounding::same(4.0), Stroke::new(1.0, Color32::from_rgb(200, 200, 210)));

                    if response.clicked() {
                        let current_idx = COLOR_PRESETS.iter().position(|c| *c == self.color).unwrap_or(0);
                        self.color = COLOR_PRESETS[(current_idx + 1) % COLOR_PRESETS.len()];
                    }
                    response.on_hover_text("Click to change color");

                    let text_response = ui.add(
                        TextEdit::singleline(&mut self.input)
                            .desired_width(110.0)
                            .hint_text("Name"),
                    );

                    let add_btn = egui::Button::new(
                        RichText::new("Add").color(Color32::WHITE).size(12.0),
                    )
                    .fill(Color32::from_rgb(59, 130, 246))
                    .rounding(Rounding::same(4.0))
                    .min_size(Vec2::new(45.0, 26.0));

                    let cancel_btn = egui::Button::new(
                        RichText::new("×").size(14.0).color(Color32::from_rgb(120, 120, 130)),
                    )
                    .fill(Color32::TRANSPARENT)
                    .stroke(Stroke::NONE);

                    let should_add = ui.add(add_btn).clicked()
                        || (text_response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)));

                    if should_add && !self.input.trim().is_empty() {
                        result = Some((self.input.clone(), self.color));
                        self.close();
                    }

                    if ui.add(cancel_btn).clicked() {
                        self.close();
                    }
                });
            });

        result
    }
}
