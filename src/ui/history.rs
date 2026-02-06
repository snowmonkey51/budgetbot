use egui::{Color32, Margin, RichText, Rounding, Stroke, Ui, Vec2};
use uuid::Uuid;

use crate::models::Budget;

pub enum HistoryAction {
    DeleteExpense(Uuid),
    ToggleExpense(Uuid),
    SaveAsPreset(Uuid),
}

/// Render the expenses header (title and count) - call this outside the scroll area
pub fn render_expenses_header(ui: &mut Ui, expense_count: usize) {
    ui.horizontal(|ui| {
        ui.label(
            RichText::new("Expenses")
                .size(18.0)
                .color(Color32::from_rgb(17, 24, 39))
                .strong(),
        );

        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            ui.label(
                RichText::new(format!("{} items", expense_count))
                    .size(12.0)
                    .color(Color32::from_rgb(156, 163, 175)),
            );
        });
    });

    ui.add_space(16.0);
}

pub fn render_expenses(ui: &mut Ui, budget: &mut Budget) -> Option<HistoryAction> {
    let mut action = None;

    if budget.expenses.is_empty() {
        // Modern empty state
        ui.vertical_centered(|ui| {
            ui.add_space(60.0);

            // Empty state icon
            ui.label(
                RichText::new("📝")
                    .size(48.0),
            );

            ui.add_space(16.0);

            ui.label(
                RichText::new("No expenses yet")
                    .size(16.0)
                    .color(Color32::from_rgb(107, 114, 128))
                    .strong(),
            );
            ui.add_space(6.0);
            ui.label(
                RichText::new("Add your first expense to start tracking")
                    .size(13.0)
                    .color(Color32::from_rgb(156, 163, 175)),
            );
            ui.add_space(60.0);
        });
    } else {
        // Sort expenses by date (most recent first)
        let mut expense_indices: Vec<_> = budget.expenses.iter().enumerate().collect();
        expense_indices.sort_by(|a, b| b.1.date.cmp(&a.1.date));
        let sorted_indices: Vec<usize> = expense_indices.iter().map(|(i, _)| *i).collect();

        ui.spacing_mut().item_spacing = Vec2::new(6.0, 6.0);

        for idx in sorted_indices {
            let expense = &budget.expenses[idx];
            let expense_id = expense.id;
            let is_active = expense.active;

            let cat_color = budget.get_category_color(&expense.category);
            let base = Color32::from_rgb(cat_color[0], cat_color[1], cat_color[2]);

            // Dim colors if inactive
            let bg_color = if is_active {
                Color32::from_rgb(
                    250 - (250 - cat_color[0]) / 12,
                    250 - (250 - cat_color[1]) / 12,
                    250 - (250 - cat_color[2]) / 12,
                )
            } else {
                Color32::from_rgb(245, 245, 245)
            };

            let text_color = if is_active {
                Color32::from_rgb(17, 24, 39)
            } else {
                Color32::from_rgb(180, 180, 180)
            };

            egui::Frame::none()
                .fill(bg_color)
                .rounding(Rounding::same(10.0))
                .stroke(Stroke::NONE)
                .inner_margin(Margin::symmetric(12.0, 8.0))
                .show(ui, |ui| {
                    ui.horizontal(|ui| {
                        // Checkbox for active/inactive - centered vertically
                        ui.vertical(|ui| {
                            ui.add_space(8.0);
                            let mut active = is_active;
                            if ui.checkbox(&mut active, "").changed() {
                                action = Some(HistoryAction::ToggleExpense(expense_id));
                            }
                        });

                        // Compact color indicator
                        let color = if is_active {
                            Color32::from_rgb(cat_color[0], cat_color[1], cat_color[2])
                        } else {
                            Color32::from_rgb(200, 200, 200)
                        };
                        let (rect, _) = ui.allocate_exact_size(Vec2::new(4.0, 32.0), egui::Sense::hover());
                        ui.painter().rect_filled(rect, Rounding::same(2.0), color);
                        ui.add_space(10.0);

                        // Left side: description and category on one line
                        let expense = &budget.expenses[idx];
                        ui.vertical(|ui| {
                            ui.set_min_width(120.0);

                            let title = if expense.description.is_empty() {
                                expense.category.clone()
                            } else {
                                expense.description.clone()
                            };

                            ui.label(
                                RichText::new(title)
                                    .size(13.0)
                                    .color(text_color)
                                    .strong(),
                            );

                            // Category and date on same line, more compact
                            let sub_color = if is_active { base } else { Color32::from_rgb(180, 180, 180) };
                            let date_color = if is_active { Color32::from_rgb(156, 163, 175) } else { Color32::from_rgb(190, 190, 190) };
                            ui.horizontal(|ui| {
                                ui.label(
                                    RichText::new(&expense.category)
                                        .size(10.0)
                                        .color(sub_color),
                                );
                                ui.label(
                                    RichText::new("·")
                                        .size(10.0)
                                        .color(Color32::from_rgb(180, 180, 190)),
                                );
                                ui.label(
                                    RichText::new(expense.date.format("%b %d").to_string())
                                        .size(10.0)
                                        .color(date_color),
                                );
                            });
                        });

                        ui.with_layout(
                            egui::Layout::right_to_left(egui::Align::Center),
                            |ui| {
                                // Compact delete button
                                let del_btn = egui::Button::new(
                                    RichText::new("X")
                                        .size(10.0)
                                        .color(Color32::from_rgb(156, 163, 175)),
                                )
                                .fill(Color32::from_rgba_unmultiplied(0, 0, 0, 8))
                                .stroke(Stroke::NONE)
                                .rounding(Rounding::same(6.0))
                                .min_size(Vec2::new(22.0, 22.0));

                                if ui.add(del_btn).clicked() {
                                    action = Some(HistoryAction::DeleteExpense(expense_id));
                                }

                                ui.add_space(4.0);

                                // Save as preset button
                                let preset_btn = egui::Button::new(
                                    RichText::new("⚡")
                                        .size(10.0),
                                )
                                .fill(Color32::from_rgba_unmultiplied(0, 0, 0, 8))
                                .stroke(Stroke::NONE)
                                .rounding(Rounding::same(6.0))
                                .min_size(Vec2::new(22.0, 22.0));

                                if ui.add(preset_btn).on_hover_text("Save as preset").clicked() {
                                    action = Some(HistoryAction::SaveAsPreset(expense_id));
                                }

                                ui.add_space(8.0);

                                // Amount - compact
                                ui.label(
                                    RichText::new(format!("-${:.2}", expense.amount))
                                        .size(14.0)
                                        .color(text_color)
                                        .strong(),
                                );
                            },
                        );
                    });
                });
        }
    }

    action
}

/// Render the available balance bar - separate from expenses so it can be pinned at bottom
pub fn render_balance_bar(ui: &mut Ui, budget: &Budget) {
    let income = budget.total_income();
    let balance = budget.remaining_balance();

    // Calculate percentage remaining (0.0 to 1.0)
    let percentage = if income > 0.0 {
        (balance / income).clamp(0.0, 1.0)
    } else {
        0.0
    };

    // Modern color gradient - smoother transitions
    let bar_color = if percentage > 0.5 {
        // Green to yellow (50% to 100%)
        let t = (percentage - 0.5) * 2.0;
        Color32::from_rgb(
            (251.0 - (251.0 - 16.0) * t) as u8,
            (191.0 + (185.0 - 191.0) * t) as u8,
            (36.0 + (129.0 - 36.0) * t) as u8,
        )
    } else if percentage > 0.25 {
        // Yellow to orange (25% to 50%)
        let t = (percentage - 0.25) * 4.0;
        Color32::from_rgb(
            (249.0 + (251.0 - 249.0) * t) as u8,
            (115.0 + (191.0 - 115.0) * t) as u8,
            (22.0 + (36.0 - 22.0) * t) as u8,
        )
    } else {
        // Red to orange (0% to 25%)
        let t = percentage * 4.0;
        Color32::from_rgb(
            (239.0 + (249.0 - 239.0) * t) as u8,
            (68.0 + (115.0 - 68.0) * t) as u8,
            (68.0 + (22.0 - 68.0_f64).abs() * t) as u8,
        )
    };

    ui.horizontal(|ui| {
        ui.label(
            RichText::new("Available Balance")
                .size(15.0)
                .color(Color32::from_rgb(55, 65, 81))
                .strong(),
        );

        ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
            let sign = if balance >= 0.0 { "" } else { "-" };
            ui.label(
                RichText::new(format!("{}${:.2}", sign, balance.abs()))
                    .size(22.0)
                    .color(Color32::from_rgb(17, 24, 39))
                    .strong(),
            );
        });
    });

    ui.add_space(12.0);

    // Modern balance bar with smoother styling
    let bar_width = ui.available_width();
    let bar_height = 10.0;
    let (bar_rect, _) = ui.allocate_exact_size(Vec2::new(bar_width, bar_height), egui::Sense::hover());

    // Background with subtle gradient feel
    ui.painter().rect_filled(
        bar_rect,
        Rounding::same(5.0),
        Color32::from_rgb(229, 231, 235),
    );

    // Filled portion with smooth corners
    if percentage > 0.0 {
        let mut fill_rect = bar_rect;
        fill_rect.set_right(bar_rect.left() + bar_width * percentage as f32);
        ui.painter().rect_filled(
            fill_rect,
            Rounding::same(5.0),
            bar_color,
        );
    }

    ui.add_space(6.0);

    // Percentage indicator
    ui.horizontal(|ui| {
        let pct_text = format!("{:.0}% remaining", percentage * 100.0);
        ui.label(
            RichText::new(pct_text)
                .size(12.0)
                .color(Color32::from_rgb(156, 163, 175)),
        );
    });
}
