use chrono::{Datelike, NaiveDate};
use egui::{Color32, ComboBox, Margin, RichText, Rounding, Stroke, Vec2};
use std::collections::HashMap;

use crate::models::{CategoryColor, Expense};
use super::category_manager::AddCategoryPopup;

pub struct ExpenseForm {
    pub is_open: bool,
    pub amount: String,
    pub category: String,
    pub description: String,
    pub selected_date: NaiveDate,
    pub show_calendar: bool,
    pub calendar_year: i32,
    pub calendar_month: u32,
    pub add_category_popup: AddCategoryPopup,
}

impl Default for ExpenseForm {
    fn default() -> Self {
        Self::new()
    }
}

impl ExpenseForm {
    pub fn new() -> Self {
        let today = chrono::Local::now().date_naive();
        Self {
            is_open: false,
            amount: String::new(),
            category: String::new(),
            description: String::new(),
            selected_date: today,
            show_calendar: false,
            calendar_year: today.year(),
            calendar_month: today.month(),
            add_category_popup: AddCategoryPopup::new(),
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
        self.reset_fields();
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.show_calendar = false;
        self.add_category_popup.close();
    }

    fn reset_fields(&mut self) {
        let today = chrono::Local::now().date_naive();
        self.amount.clear();
        self.category.clear();
        self.description.clear();
        self.selected_date = today;
        self.show_calendar = false;
        self.calendar_year = today.year();
        self.calendar_month = today.month();
    }

    /// Returns (Option<Expense>, Option<(new_category_name, color)>)
    pub fn render(
        &mut self,
        ctx: &egui::Context,
        categories: &[String],
        category_colors: &HashMap<String, CategoryColor>,
    ) -> (Option<Expense>, Option<(String, CategoryColor)>) {
        let mut result_expense: Option<Expense> = None;
        let mut new_category: Option<(String, CategoryColor)> = None;

        if !self.is_open {
            return (None, None);
        }

        // Set default category if empty and categories exist
        if self.category.is_empty() && !categories.is_empty() {
            self.category = categories[0].clone();
        }

        let mut should_close = false;

        // Increase window height to accommodate calendar
        let window_height = if self.show_calendar { 600.0 } else { 420.0 };

        egui::Window::new("Add Expense")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([380.0, window_height])
            .frame(egui::Frame::none()
                .fill(Color32::WHITE)
                .rounding(Rounding::same(20.0))
                .stroke(Stroke::NONE)
                .inner_margin(Margin::same(28.0))
                .shadow(egui::epaint::Shadow {
                    spread: 0.0,
                    blur: 40.0,
                    color: Color32::from_black_alpha(40),
                    offset: [0.0, 8.0].into(),
                }))
            .show(ctx, |ui| {
                let label_color = Color32::from_rgb(107, 114, 128);

                // Modern header with accent
                ui.horizontal(|ui| {
                    // Accent dot
                    let (rect, _) = ui.allocate_exact_size(Vec2::splat(10.0), egui::Sense::hover());
                    ui.painter().circle_filled(rect.center(), 5.0, Color32::from_rgb(239, 68, 68));
                    ui.add_space(10.0);

                    ui.label(
                        RichText::new("New Expense")
                            .size(20.0)
                            .color(Color32::from_rgb(17, 24, 39))
                            .strong(),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        let close_btn = egui::Button::new(
                            RichText::new("X").size(14.0).color(Color32::from_rgb(156, 163, 175)),
                        )
                        .fill(Color32::from_rgb(243, 244, 246))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(8.0))
                        .min_size(Vec2::new(32.0, 32.0));

                        if ui.add(close_btn).clicked() {
                            should_close = true;
                        }
                    });
                });

                ui.add_space(24.0);

                ui.vertical(|ui| {
                    ui.spacing_mut().item_spacing = Vec2::new(8.0, 16.0);

                    // Amount field with modern styling
                    ui.vertical(|ui| {
                        ui.label(RichText::new("Amount").size(13.0).color(label_color).strong());
                        ui.add_space(6.0);
                        egui::Frame::none()
                            .fill(Color32::from_rgb(249, 250, 251))
                            .rounding(Rounding::same(12.0))
                            .inner_margin(Margin::symmetric(14.0, 12.0))
                            .show(ui, |ui| {
                                ui.horizontal(|ui| {
                                    ui.label(RichText::new("$").size(18.0).color(Color32::from_rgb(107, 114, 128)));
                                    ui.add(
                                        egui::TextEdit::singleline(&mut self.amount)
                                            .desired_width(220.0)
                                            .hint_text("0.00")
                                            .frame(false)
                                            .font(egui::TextStyle::Heading),
                                    );
                                });
                            });
                    });

                    // Category field
                    ui.vertical(|ui| {
                        ui.label(RichText::new("Category").size(13.0).color(label_color).strong());
                        ui.add_space(6.0);
                        ui.horizontal(|ui| {
                            // Show color swatch for selected category
                            if !self.category.is_empty() {
                                let cat_color = category_colors
                                    .get(&self.category)
                                    .copied()
                                    .unwrap_or([156, 163, 175]);
                                let color = Color32::from_rgb(cat_color[0], cat_color[1], cat_color[2]);
                                let (rect, _) = ui.allocate_exact_size(Vec2::splat(28.0), egui::Sense::hover());
                                ui.painter().rect_filled(rect, Rounding::same(8.0), color);
                            }

                            ComboBox::from_id_salt("expense_category_popup")
                                .width(200.0)
                                .selected_text(if self.category.is_empty() { "Select category..." } else { &self.category })
                                .show_ui(ui, |ui| {
                                    for cat in categories {
                                        let cat_color = category_colors
                                            .get(cat)
                                            .copied()
                                            .unwrap_or([156, 163, 175]);
                                        let color = Color32::from_rgb(cat_color[0], cat_color[1], cat_color[2]);

                                        ui.horizontal(|ui| {
                                            let (rect, _) = ui.allocate_exact_size(Vec2::splat(14.0), egui::Sense::hover());
                                            ui.painter().rect_filled(rect, Rounding::same(4.0), color);
                                            ui.selectable_value(&mut self.category, cat.clone(), cat);
                                        });
                                    }
                                });

                            // Add new category button
                            let add_cat_btn = egui::Button::new(
                                RichText::new("+").size(16.0).color(Color32::from_rgb(99, 102, 241)),
                            )
                            .fill(Color32::from_rgb(238, 242, 255))
                            .stroke(Stroke::NONE)
                            .rounding(Rounding::same(10.0))
                            .min_size(Vec2::new(36.0, 36.0));

                            if ui.add(add_cat_btn).on_hover_text("Add new category").clicked() {
                                self.add_category_popup.open();
                            }
                        });

                        // Show add category popup if open
                        if let Some((cat_name, cat_color)) = self.add_category_popup.render(ui) {
                            self.category = cat_name.clone();
                            new_category = Some((cat_name, cat_color));
                        }
                    });

                    // Description field
                    ui.vertical(|ui| {
                        ui.label(RichText::new("Description").size(13.0).color(label_color).strong());
                        ui.add_space(6.0);
                        egui::Frame::none()
                            .fill(Color32::from_rgb(249, 250, 251))
                            .rounding(Rounding::same(12.0))
                            .inner_margin(Margin::symmetric(14.0, 12.0))
                            .show(ui, |ui| {
                                ui.add(
                                    egui::TextEdit::singleline(&mut self.description)
                                        .desired_width(300.0)
                                        .hint_text("Optional note...")
                                        .frame(false),
                                );
                            });
                    });

                    // Date field with calendar button
                    ui.vertical(|ui| {
                        ui.label(RichText::new("Date").size(13.0).color(label_color).strong());
                        ui.add_space(6.0);
                        ui.horizontal(|ui| {
                            // Date display button
                            let date_text = self.selected_date.format("%b %d, %Y").to_string();
                            let date_btn = egui::Button::new(
                                RichText::new(&date_text)
                                    .size(14.0)
                                    .color(Color32::from_rgb(17, 24, 39)),
                            )
                            .fill(Color32::from_rgb(249, 250, 251))
                            .stroke(Stroke::NONE)
                            .rounding(Rounding::same(12.0))
                            .min_size(Vec2::new(160.0, 40.0));

                            if ui.add(date_btn).clicked() {
                                self.show_calendar = !self.show_calendar;
                                if self.show_calendar {
                                    self.calendar_year = self.selected_date.year();
                                    self.calendar_month = self.selected_date.month();
                                }
                            }

                            // Calendar icon button
                            let cal_btn = egui::Button::new(
                                RichText::new("📅").size(18.0),
                            )
                            .fill(Color32::from_rgb(238, 242, 255))
                            .stroke(Stroke::NONE)
                            .rounding(Rounding::same(10.0))
                            .min_size(Vec2::new(40.0, 40.0));

                            if ui.add(cal_btn).clicked() {
                                self.show_calendar = !self.show_calendar;
                                if self.show_calendar {
                                    self.calendar_year = self.selected_date.year();
                                    self.calendar_month = self.selected_date.month();
                                }
                            }
                        });

                        // Calendar popup
                        if self.show_calendar {
                            ui.add_space(12.0);
                            self.render_calendar(ui);
                        }
                    });

                    ui.add_space(12.0);

                    // Modern buttons row
                    ui.horizontal(|ui| {
                        // Cancel button
                        let cancel_btn = egui::Button::new(
                            RichText::new("Cancel").size(14.0).color(Color32::from_rgb(107, 114, 128)),
                        )
                        .fill(Color32::from_rgb(243, 244, 246))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(120.0, 44.0));

                        if ui.add(cancel_btn).clicked() {
                            should_close = true;
                        }

                        ui.add_space(12.0);

                        // Submit button
                        let submit_btn = egui::Button::new(
                            RichText::new("Add Expense").color(Color32::WHITE).size(14.0).strong(),
                        )
                        .fill(Color32::from_rgb(239, 68, 68))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(12.0))
                        .min_size(Vec2::new(150.0, 44.0));

                        if ui.add(submit_btn).clicked() {
                            if let Some(expense) = self.create_expense() {
                                result_expense = Some(expense);
                                should_close = true;
                            }
                        }
                    });
                });
            });

        if should_close {
            self.close();
        }

        (result_expense, new_category)
    }

    fn render_calendar(&mut self, ui: &mut egui::Ui) {
        egui::Frame::none()
            .fill(Color32::from_rgb(249, 250, 251))
            .rounding(Rounding::same(14.0))
            .inner_margin(Margin::same(16.0))
            .show(ui, |ui| {
                // Month/Year navigation
                ui.horizontal(|ui| {
                    // Previous month button
                    let prev_btn = egui::Button::new(
                        RichText::new("‹").size(18.0).color(Color32::from_rgb(107, 114, 128)),
                    )
                    .fill(Color32::TRANSPARENT)
                    .stroke(Stroke::NONE)
                    .min_size(Vec2::new(32.0, 32.0));

                    if ui.add(prev_btn).clicked() {
                        if self.calendar_month == 1 {
                            self.calendar_month = 12;
                            self.calendar_year -= 1;
                        } else {
                            self.calendar_month -= 1;
                        }
                    }

                    ui.with_layout(egui::Layout::centered_and_justified(egui::Direction::LeftToRight), |ui| {
                        let month_names = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                        ];
                        let month_name = month_names[(self.calendar_month - 1) as usize];
                        ui.label(
                            RichText::new(format!("{} {}", month_name, self.calendar_year))
                                .size(15.0)
                                .color(Color32::from_rgb(17, 24, 39))
                                .strong(),
                        );
                    });

                    // Next month button
                    let next_btn = egui::Button::new(
                        RichText::new("›").size(18.0).color(Color32::from_rgb(107, 114, 128)),
                    )
                    .fill(Color32::TRANSPARENT)
                    .stroke(Stroke::NONE)
                    .min_size(Vec2::new(32.0, 32.0));

                    if ui.add(next_btn).clicked() {
                        if self.calendar_month == 12 {
                            self.calendar_month = 1;
                            self.calendar_year += 1;
                        } else {
                            self.calendar_month += 1;
                        }
                    }
                });

                ui.add_space(12.0);

                // Day headers
                ui.horizontal(|ui| {
                    let day_names = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
                    for day in day_names {
                        ui.allocate_ui(Vec2::new(38.0, 24.0), |ui| {
                            ui.centered_and_justified(|ui| {
                                ui.label(
                                    RichText::new(day)
                                        .size(12.0)
                                        .color(Color32::from_rgb(156, 163, 175)),
                                );
                            });
                        });
                    }
                });

                ui.add_space(6.0);

                // Calendar grid
                let first_day = NaiveDate::from_ymd_opt(self.calendar_year, self.calendar_month, 1).unwrap();
                let days_in_month = days_in_month(self.calendar_year, self.calendar_month);
                let first_weekday = first_day.weekday().num_days_from_sunday();
                let today = chrono::Local::now().date_naive();

                let mut day = 1u32;
                for _week in 0..6 {
                    if day > days_in_month {
                        break;
                    }
                    ui.horizontal(|ui| {
                        for weekday in 0..7 {
                            ui.allocate_ui(Vec2::new(38.0, 34.0), |ui| {
                                if (_week == 0 && weekday < first_weekday) || day > days_in_month {
                                    ui.label("");
                                } else {
                                    let current_date = NaiveDate::from_ymd_opt(
                                        self.calendar_year,
                                        self.calendar_month,
                                        day,
                                    ).unwrap();

                                    let is_selected = current_date == self.selected_date;
                                    let is_today = current_date == today;

                                    let (bg_color, text_color) = if is_selected {
                                        (Color32::from_rgb(239, 68, 68), Color32::WHITE)
                                    } else if is_today {
                                        (Color32::from_rgb(238, 242, 255), Color32::from_rgb(99, 102, 241))
                                    } else {
                                        (Color32::TRANSPARENT, Color32::from_rgb(55, 65, 81))
                                    };

                                    let day_btn = egui::Button::new(
                                        RichText::new(day.to_string())
                                            .size(13.0)
                                            .color(text_color),
                                    )
                                    .fill(bg_color)
                                    .stroke(Stroke::NONE)
                                    .rounding(Rounding::same(8.0))
                                    .min_size(Vec2::new(34.0, 30.0));

                                    if ui.add(day_btn).clicked() {
                                        self.selected_date = current_date;
                                        self.show_calendar = false;
                                    }

                                    day += 1;
                                }
                            });
                        }
                    });
                }
            });
    }

    fn create_expense(&self) -> Option<Expense> {
        let amount: f64 = self.amount.parse().ok()?;
        if amount <= 0.0 {
            return None;
        }

        if self.category.trim().is_empty() {
            return None;
        }

        Some(Expense::new(
            amount,
            self.category.trim().to_string(),
            self.description.trim().to_string(),
            self.selected_date,
        ))
    }
}

fn days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 30,
    }
}
