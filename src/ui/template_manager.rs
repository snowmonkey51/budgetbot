use chrono::NaiveDate;
use egui::{Color32, ComboBox, Margin, RichText, Rounding, Stroke, TextEdit, Vec2};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::{CategoryColor, Expense, Template};

pub enum TemplateAction {
    Save(String),
    Load(Uuid),
    Delete(Uuid),
    Rename(Uuid, String),
    UpdateExpenses(Uuid, Vec<Expense>),
}

/// Editing state for a single expense in the template editor
struct EditingExpense {
    id: Uuid,
    amount: String,
    category: String,
    description: String,
    date: NaiveDate,
    active: bool,
}

impl EditingExpense {
    fn from_expense(expense: &Expense) -> Self {
        Self {
            id: expense.id,
            amount: format!("{:.2}", expense.amount),
            category: expense.category.clone(),
            description: expense.description.clone(),
            date: expense.date,
            active: expense.active,
        }
    }

    fn to_expense(&self) -> Option<Expense> {
        let amount: f64 = self.amount.parse().ok()?;
        if amount <= 0.0 {
            return None;
        }
        let mut expense = Expense::new(
            amount,
            self.category.clone(),
            self.description.clone(),
            self.date,
        );
        expense.id = self.id; // Keep original ID
        expense.active = self.active;
        Some(expense)
    }
}

pub struct TemplateManager {
    pub is_open: bool,
    new_template_name: String,
    // Simple rename mode (inline in list)
    renaming_template_id: Option<Uuid>,
    renaming_name: String,
    // Full edit mode
    editing_template_id: Option<Uuid>,
    editing_template_name: String,
    editing_expenses: Vec<EditingExpense>,
    // New expense being added in edit mode
    new_expense_amount: String,
    new_expense_category: String,
    new_expense_description: String,
}

impl Default for TemplateManager {
    fn default() -> Self {
        Self::new()
    }
}

impl TemplateManager {
    pub fn new() -> Self {
        Self {
            is_open: false,
            new_template_name: String::new(),
            renaming_template_id: None,
            renaming_name: String::new(),
            editing_template_id: None,
            editing_template_name: String::new(),
            editing_expenses: Vec::new(),
            new_expense_amount: String::new(),
            new_expense_category: String::new(),
            new_expense_description: String::new(),
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
        self.new_template_name.clear();
        self.renaming_template_id = None;
        self.renaming_name.clear();
        self.clear_edit_mode();
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.new_template_name.clear();
        self.renaming_template_id = None;
        self.renaming_name.clear();
        self.clear_edit_mode();
    }

    fn clear_edit_mode(&mut self) {
        self.editing_template_id = None;
        self.editing_template_name.clear();
        self.editing_expenses.clear();
        self.new_expense_amount.clear();
        self.new_expense_category.clear();
        self.new_expense_description.clear();
    }

    fn enter_edit_mode(&mut self, template: &Template) {
        self.editing_template_id = Some(template.id);
        self.editing_template_name = template.name.clone();
        self.editing_expenses = template.expenses.iter().map(EditingExpense::from_expense).collect();
        self.new_expense_amount.clear();
        self.new_expense_category.clear();
        self.new_expense_description.clear();
    }

    pub fn render(
        &mut self,
        ctx: &egui::Context,
        templates: &[Template],
        current_expense_count: usize,
        categories: &[String],
        category_colors: &HashMap<String, CategoryColor>,
    ) -> Vec<TemplateAction> {
        let mut actions: Vec<TemplateAction> = Vec::new();

        if !self.is_open {
            return actions;
        }

        // If in full edit mode, render the editor window instead
        if self.editing_template_id.is_some() {
            return self.render_edit_mode(ctx, categories, category_colors);
        }

        egui::Window::new("Templates")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([420.0, 500.0])
            .frame(
                egui::Frame::none()
                    .fill(Color32::WHITE)
                    .rounding(Rounding::same(16.0))
                    .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                    .inner_margin(Margin::same(24.0))
                    .shadow(egui::epaint::Shadow {
                        spread: 8.0,
                        blur: 20.0,
                        color: Color32::from_black_alpha(25),
                        offset: [0.0, 4.0].into(),
                    }),
            )
            .show(ctx, |ui| {
                ui.vertical(|ui| {
                    // Header
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Expense Templates")
                                .size(18.0)
                                .color(Color32::from_rgb(30, 30, 40))
                                .strong(),
                        );

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let close_btn = egui::Button::new(
                                RichText::new("X")
                                    .size(16.0)
                                    .color(Color32::from_rgb(120, 120, 130)),
                            )
                            .fill(Color32::TRANSPARENT)
                            .stroke(Stroke::NONE);

                            if ui.add(close_btn).clicked() {
                                self.close();
                            }
                        });
                    });

                    ui.add_space(8.0);

                    // Description
                    ui.label(
                        RichText::new("Save your current expenses as a template to quickly load them later.")
                            .size(12.0)
                            .color(Color32::from_rgb(107, 114, 128)),
                    );

                    ui.add_space(16.0);

                    // Save current expenses section
                    ui.label(
                        RichText::new("Save Current Expenses")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(4.0);

                    ui.horizontal(|ui| {
                        let text_response = ui.add(
                            TextEdit::singleline(&mut self.new_template_name)
                                .desired_width(260.0)
                                .hint_text("Template name"),
                        );

                        let can_save = !self.new_template_name.trim().is_empty() && current_expense_count > 0;

                        let save_btn = egui::Button::new(
                            RichText::new("Save Template")
                                .color(if can_save { Color32::WHITE } else { Color32::from_rgb(180, 180, 180) })
                                .size(13.0)
                                .strong(),
                        )
                        .fill(if can_save { Color32::from_rgb(16, 185, 129) } else { Color32::from_rgb(220, 220, 225) })
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(10.0))
                        .min_size(Vec2::new(110.0, 32.0));

                        let should_save = ui.add(save_btn).clicked()
                            || (text_response.lost_focus() && ui.input(|i| i.key_pressed(egui::Key::Enter)));

                        if should_save && can_save {
                            actions.push(TemplateAction::Save(self.new_template_name.clone()));
                            self.new_template_name.clear();
                        }
                    });

                    if current_expense_count == 0 {
                        ui.add_space(4.0);
                        ui.label(
                            RichText::new("Add some expenses first to save a template.")
                                .size(11.0)
                                .color(Color32::from_rgb(156, 163, 175))
                                .italics(),
                        );
                    }

                    ui.add_space(20.0);

                    // Saved templates list
                    ui.label(
                        RichText::new("Saved Templates")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(8.0);

                    egui::ScrollArea::vertical()
                        .max_height(280.0)
                        .show(ui, |ui| {
                            ui.spacing_mut().item_spacing = Vec2::new(8.0, 8.0);

                            if templates.is_empty() {
                                ui.vertical_centered(|ui| {
                                    ui.add_space(40.0);
                                    ui.label(
                                        RichText::new("No templates saved yet")
                                            .size(14.0)
                                            .color(Color32::from_rgb(156, 163, 175)),
                                    );
                                    ui.add_space(8.0);
                                    ui.label(
                                        RichText::new("Save your expenses as a template to see them here.")
                                            .size(12.0)
                                            .color(Color32::from_rgb(180, 180, 190)),
                                    );
                                    ui.add_space(40.0);
                                });
                            } else {
                                for template in templates {
                                    let is_renaming = self.renaming_template_id == Some(template.id);

                                    egui::Frame::none()
                                        .fill(Color32::from_rgb(249, 250, 251))
                                        .rounding(Rounding::same(12.0))
                                        .stroke(Stroke::new(1.0, Color32::from_rgb(229, 231, 235)))
                                        .inner_margin(Margin::same(16.0))
                                        .show(ui, |ui| {
                                            ui.vertical(|ui| {
                                                if is_renaming {
                                                    // Rename mode (inline)
                                                    ui.horizontal(|ui| {
                                                        ui.add(
                                                            TextEdit::singleline(&mut self.renaming_name)
                                                                .desired_width(200.0),
                                                        );

                                                        let save_rename_btn = egui::Button::new(
                                                            RichText::new("Save")
                                                                .size(11.0)
                                                                .color(Color32::WHITE),
                                                        )
                                                        .fill(Color32::from_rgb(16, 185, 129))
                                                        .stroke(Stroke::NONE)
                                                        .rounding(Rounding::same(6.0))
                                                        .min_size(Vec2::new(50.0, 26.0));

                                                        if ui.add(save_rename_btn).clicked() && !self.renaming_name.trim().is_empty() {
                                                            actions.push(TemplateAction::Rename(template.id, self.renaming_name.clone()));
                                                            self.renaming_template_id = None;
                                                            self.renaming_name.clear();
                                                        }

                                                        let cancel_btn = egui::Button::new(
                                                            RichText::new("Cancel")
                                                                .size(11.0)
                                                                .color(Color32::from_rgb(107, 114, 128)),
                                                        )
                                                        .fill(Color32::from_rgb(243, 244, 246))
                                                        .stroke(Stroke::NONE)
                                                        .rounding(Rounding::same(6.0))
                                                        .min_size(Vec2::new(55.0, 26.0));

                                                        if ui.add(cancel_btn).clicked() {
                                                            self.renaming_template_id = None;
                                                            self.renaming_name.clear();
                                                        }
                                                    });
                                                } else {
                                                    // Display mode
                                                    ui.horizontal(|ui| {
                                                        ui.vertical(|ui| {
                                                            ui.label(
                                                                RichText::new(&template.name)
                                                                    .size(14.0)
                                                                    .color(Color32::from_rgb(17, 24, 39))
                                                                    .strong(),
                                                            );
                                                            ui.horizontal(|ui| {
                                                                ui.label(
                                                                    RichText::new(format!("{} expenses", template.expenses.len()))
                                                                        .size(11.0)
                                                                        .color(Color32::from_rgb(107, 114, 128)),
                                                                );
                                                                ui.label(
                                                                    RichText::new("·")
                                                                        .size(11.0)
                                                                        .color(Color32::from_rgb(180, 180, 190)),
                                                                );
                                                                ui.label(
                                                                    RichText::new(format!("${:.2} total", template.total()))
                                                                        .size(11.0)
                                                                        .color(Color32::from_rgb(107, 114, 128)),
                                                                );
                                                            });
                                                        });

                                                        ui.with_layout(
                                                            egui::Layout::right_to_left(egui::Align::Center),
                                                            |ui| {
                                                                // Delete button
                                                                let del_btn = egui::Button::new(
                                                                    RichText::new("X")
                                                                        .size(12.0)
                                                                        .color(Color32::from_rgb(220, 38, 38)),
                                                                )
                                                                .fill(Color32::from_rgb(254, 242, 242))
                                                                .stroke(Stroke::NONE)
                                                                .rounding(Rounding::same(6.0))
                                                                .min_size(Vec2::new(28.0, 28.0));

                                                                if ui.add(del_btn).clicked() {
                                                                    actions.push(TemplateAction::Delete(template.id));
                                                                }

                                                                ui.add_space(4.0);

                                                                // Edit button (opens full editor)
                                                                let edit_btn = egui::Button::new(
                                                                    RichText::new("Edit")
                                                                        .size(11.0)
                                                                        .color(Color32::from_rgb(99, 102, 241)),
                                                                )
                                                                .fill(Color32::from_rgb(238, 242, 255))
                                                                .stroke(Stroke::NONE)
                                                                .rounding(Rounding::same(6.0))
                                                                .min_size(Vec2::new(45.0, 28.0));

                                                                if ui.add(edit_btn).clicked() {
                                                                    self.enter_edit_mode(template);
                                                                }

                                                                ui.add_space(4.0);

                                                                // Load button
                                                                let load_btn = egui::Button::new(
                                                                    RichText::new("Load")
                                                                        .size(11.0)
                                                                        .color(Color32::WHITE)
                                                                        .strong(),
                                                                )
                                                                .fill(Color32::from_rgb(99, 102, 241))
                                                                .stroke(Stroke::NONE)
                                                                .rounding(Rounding::same(6.0))
                                                                .min_size(Vec2::new(50.0, 28.0));

                                                                if ui.add(load_btn).clicked() {
                                                                    actions.push(TemplateAction::Load(template.id));
                                                                }
                                                            },
                                                        );
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

    fn render_edit_mode(
        &mut self,
        ctx: &egui::Context,
        categories: &[String],
        category_colors: &HashMap<String, CategoryColor>,
    ) -> Vec<TemplateAction> {
        let mut actions: Vec<TemplateAction> = Vec::new();
        let mut should_save = false;
        let mut should_cancel = false;
        let mut expense_to_delete: Option<usize> = None;

        let template_id = self.editing_template_id.unwrap();

        egui::Window::new("Edit Template")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([500.0, 600.0])
            .frame(
                egui::Frame::none()
                    .fill(Color32::WHITE)
                    .rounding(Rounding::same(16.0))
                    .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                    .inner_margin(Margin::same(24.0))
                    .shadow(egui::epaint::Shadow {
                        spread: 8.0,
                        blur: 20.0,
                        color: Color32::from_black_alpha(25),
                        offset: [0.0, 4.0].into(),
                    }),
            )
            .show(ctx, |ui| {
                ui.vertical(|ui| {
                    // Header
                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Edit Template")
                                .size(18.0)
                                .color(Color32::from_rgb(30, 30, 40))
                                .strong(),
                        );

                        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                            let close_btn = egui::Button::new(
                                RichText::new("X")
                                    .size(16.0)
                                    .color(Color32::from_rgb(120, 120, 130)),
                            )
                            .fill(Color32::TRANSPARENT)
                            .stroke(Stroke::NONE);

                            if ui.add(close_btn).clicked() {
                                should_cancel = true;
                            }
                        });
                    });

                    ui.add_space(16.0);

                    // Template name
                    ui.label(
                        RichText::new("Template Name")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(4.0);
                    ui.add(
                        TextEdit::singleline(&mut self.editing_template_name)
                            .desired_width(450.0)
                            .hint_text("Template name"),
                    );

                    ui.add_space(20.0);

                    // Add new expense section
                    ui.label(
                        RichText::new("Add New Expense")
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(4.0);

                    egui::Frame::none()
                        .fill(Color32::from_rgb(249, 250, 251))
                        .rounding(Rounding::same(10.0))
                        .inner_margin(Margin::same(12.0))
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                // Amount
                                ui.label(RichText::new("$").size(14.0).color(Color32::from_rgb(107, 114, 128)));
                                ui.add(
                                    TextEdit::singleline(&mut self.new_expense_amount)
                                        .desired_width(70.0)
                                        .hint_text("0.00"),
                                );

                                ui.add_space(8.0);

                                // Category dropdown
                                let default_category = if categories.is_empty() {
                                    String::new()
                                } else if self.new_expense_category.is_empty() {
                                    categories[0].clone()
                                } else {
                                    self.new_expense_category.clone()
                                };

                                if self.new_expense_category.is_empty() && !categories.is_empty() {
                                    self.new_expense_category = categories[0].clone();
                                }

                                ComboBox::from_id_salt("new_expense_cat_edit")
                                    .width(120.0)
                                    .selected_text(&default_category)
                                    .show_ui(ui, |ui| {
                                        for cat in categories {
                                            ui.selectable_value(&mut self.new_expense_category, cat.clone(), cat);
                                        }
                                    });

                                ui.add_space(8.0);

                                // Description
                                ui.add(
                                    TextEdit::singleline(&mut self.new_expense_description)
                                        .desired_width(100.0)
                                        .hint_text("Note"),
                                );

                                ui.add_space(8.0);

                                // Add button
                                let can_add = !self.new_expense_amount.is_empty()
                                    && self.new_expense_amount.parse::<f64>().map(|v| v > 0.0).unwrap_or(false)
                                    && !self.new_expense_category.is_empty();

                                let add_btn = egui::Button::new(
                                    RichText::new("+")
                                        .size(16.0)
                                        .color(if can_add { Color32::WHITE } else { Color32::from_rgb(180, 180, 180) }),
                                )
                                .fill(if can_add { Color32::from_rgb(16, 185, 129) } else { Color32::from_rgb(220, 220, 225) })
                                .stroke(Stroke::NONE)
                                .rounding(Rounding::same(8.0))
                                .min_size(Vec2::new(32.0, 28.0));

                                if ui.add(add_btn).clicked() && can_add {
                                    if let Ok(amount) = self.new_expense_amount.parse::<f64>() {
                                        let new_expense = EditingExpense {
                                            id: Uuid::new_v4(),
                                            amount: format!("{:.2}", amount),
                                            category: self.new_expense_category.clone(),
                                            description: self.new_expense_description.clone(),
                                            date: chrono::Local::now().date_naive(),
                                            active: true,
                                        };
                                        self.editing_expenses.push(new_expense);
                                        self.new_expense_amount.clear();
                                        self.new_expense_description.clear();
                                    }
                                }
                            });
                        });

                    ui.add_space(16.0);

                    // Expenses list
                    ui.label(
                        RichText::new(format!("Expenses ({})", self.editing_expenses.len()))
                            .size(12.0)
                            .color(Color32::from_rgb(100, 100, 110)),
                    );
                    ui.add_space(8.0);

                    egui::ScrollArea::vertical()
                        .max_height(300.0)
                        .show(ui, |ui| {
                            ui.spacing_mut().item_spacing = Vec2::new(6.0, 6.0);

                            if self.editing_expenses.is_empty() {
                                ui.vertical_centered(|ui| {
                                    ui.add_space(30.0);
                                    ui.label(
                                        RichText::new("No expenses in this template")
                                            .size(13.0)
                                            .color(Color32::from_rgb(156, 163, 175)),
                                    );
                                    ui.add_space(30.0);
                                });
                            } else {
                                for (idx, expense) in self.editing_expenses.iter_mut().enumerate() {
                                    let cat_color = category_colors
                                        .get(&expense.category)
                                        .copied()
                                        .unwrap_or([156, 163, 175]);

                                    let bg_color = if expense.active {
                                        Color32::from_rgb(
                                            250 - (250 - cat_color[0]) / 12,
                                            250 - (250 - cat_color[1]) / 12,
                                            250 - (250 - cat_color[2]) / 12,
                                        )
                                    } else {
                                        Color32::from_rgb(245, 245, 245)
                                    };

                                    egui::Frame::none()
                                        .fill(bg_color)
                                        .rounding(Rounding::same(8.0))
                                        .inner_margin(Margin::symmetric(10.0, 8.0))
                                        .show(ui, |ui| {
                                            ui.horizontal(|ui| {
                                                // Active checkbox
                                                ui.checkbox(&mut expense.active, "");

                                                // Amount field
                                                ui.label(RichText::new("$").size(12.0).color(Color32::from_rgb(107, 114, 128)));
                                                ui.add(
                                                    TextEdit::singleline(&mut expense.amount)
                                                        .desired_width(60.0),
                                                );

                                                // Category dropdown
                                                ComboBox::from_id_salt(format!("edit_expense_cat_{}", idx))
                                                    .width(100.0)
                                                    .selected_text(&expense.category)
                                                    .show_ui(ui, |ui| {
                                                        for cat in categories {
                                                            ui.selectable_value(&mut expense.category, cat.clone(), cat);
                                                        }
                                                    });

                                                // Description
                                                ui.add(
                                                    TextEdit::singleline(&mut expense.description)
                                                        .desired_width(80.0)
                                                        .hint_text("Note"),
                                                );

                                                ui.with_layout(
                                                    egui::Layout::right_to_left(egui::Align::Center),
                                                    |ui| {
                                                        // Delete button
                                                        let del_btn = egui::Button::new(
                                                            RichText::new("X")
                                                                .size(11.0)
                                                                .color(Color32::from_rgb(220, 38, 38)),
                                                        )
                                                        .fill(Color32::from_rgb(254, 242, 242))
                                                        .stroke(Stroke::NONE)
                                                        .rounding(Rounding::same(4.0))
                                                        .min_size(Vec2::new(24.0, 24.0));

                                                        if ui.add(del_btn).clicked() {
                                                            expense_to_delete = Some(idx);
                                                        }
                                                    },
                                                );
                                            });
                                        });
                                }
                            }
                        });

                    // Delete expense if marked
                    if let Some(idx) = expense_to_delete {
                        self.editing_expenses.remove(idx);
                    }

                    ui.add_space(16.0);

                    // Total
                    let total: f64 = self.editing_expenses
                        .iter()
                        .filter(|e| e.active)
                        .filter_map(|e| e.amount.parse::<f64>().ok())
                        .sum();

                    ui.horizontal(|ui| {
                        ui.label(
                            RichText::new("Total:")
                                .size(14.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        );
                        ui.label(
                            RichText::new(format!("${:.2}", total))
                                .size(14.0)
                                .color(Color32::from_rgb(17, 24, 39))
                                .strong(),
                        );
                    });

                    ui.add_space(16.0);

                    // Buttons
                    ui.horizontal(|ui| {
                        let cancel_btn = egui::Button::new(
                            RichText::new("Cancel")
                                .size(13.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        )
                        .fill(Color32::from_rgb(243, 244, 246))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(10.0))
                        .min_size(Vec2::new(100.0, 38.0));

                        if ui.add(cancel_btn).clicked() {
                            should_cancel = true;
                        }

                        ui.add_space(12.0);

                        let can_save_edit = !self.editing_template_name.trim().is_empty();

                        let save_btn = egui::Button::new(
                            RichText::new("Save Changes")
                                .size(13.0)
                                .color(if can_save_edit { Color32::WHITE } else { Color32::from_rgb(180, 180, 180) })
                                .strong(),
                        )
                        .fill(if can_save_edit { Color32::from_rgb(99, 102, 241) } else { Color32::from_rgb(220, 220, 225) })
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(10.0))
                        .min_size(Vec2::new(140.0, 38.0));

                        if ui.add(save_btn).clicked() && can_save_edit {
                            should_save = true;
                        }
                    });
                });
            });

        if should_cancel {
            self.clear_edit_mode();
        }

        if should_save {
            // Rename if name changed
            actions.push(TemplateAction::Rename(template_id, self.editing_template_name.clone()));

            // Collect valid expenses
            let expenses: Vec<Expense> = self.editing_expenses
                .iter()
                .filter_map(|e| e.to_expense())
                .collect();

            actions.push(TemplateAction::UpdateExpenses(template_id, expenses));
            self.clear_edit_mode();
        }

        actions
    }
}
