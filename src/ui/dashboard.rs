use egui::{Color32, RichText, Rounding, Stroke, Ui, Vec2};

use crate::models::Budget;

/// Returns true if the Edit button was clicked
pub fn render_dashboard(ui: &mut Ui, budget: &Budget) -> bool {
    let total_income = budget.total_income();
    let total_expenses = budget.total_expenses();
    let available_balance = budget.remaining_balance();
    let mut edit_clicked = false;

    ui.vertical(|ui| {
        // Header
        ui.label(
            RichText::new("Available Balance")
                .size(13.0)
                .color(Color32::from_rgb(107, 114, 128)),
        );

        ui.add_space(8.0);

        // Large available balance display
        let balance_color = if available_balance >= 0.0 {
            Color32::from_rgb(17, 24, 39) // Dark text for positive
        } else {
            Color32::from_rgb(239, 68, 68) // Red for negative
        };
        let sign = if available_balance < 0.0 { "-" } else { "" };
        ui.label(
            RichText::new(format!("{}${:.2}", sign, available_balance.abs()))
                .size(42.0)
                .color(balance_color)
                .strong(),
        );

        ui.add_space(20.0);

        // Income summary card - green style with Edit button
        egui::Frame::none()
            .fill(Color32::from_rgb(236, 253, 245))
            .rounding(Rounding::same(12.0))
            .inner_margin(egui::Margin::symmetric(14.0, 12.0))
            .show(ui, |ui| {
                ui.horizontal(|ui| {
                    // Green indicator dot
                    let (rect, _) = ui.allocate_exact_size(Vec2::splat(10.0), egui::Sense::hover());
                    ui.painter().circle_filled(
                        rect.center(),
                        5.0,
                        Color32::from_rgb(16, 185, 129),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        RichText::new("Income")
                            .size(13.0)
                            .color(Color32::from_rgb(6, 95, 70)),
                    );

                    ui.add_space(12.0);

                    // Edit button
                    let edit_btn = egui::Button::new(
                        RichText::new("Edit")
                            .size(11.0)
                            .color(Color32::from_rgb(5, 150, 105)),
                    )
                    .fill(Color32::from_rgb(209, 250, 229))
                    .stroke(Stroke::new(1.0, Color32::from_rgb(167, 243, 208)))
                    .rounding(Rounding::same(6.0))
                    .min_size(Vec2::new(50.0, 24.0));

                    if ui.add(edit_btn).clicked() {
                        edit_clicked = true;
                    }

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        ui.label(
                            RichText::new(format!("${:.2}", total_income))
                                .size(16.0)
                                .color(Color32::from_rgb(5, 150, 105))
                                .strong(),
                        );
                    });
                });
            });

        ui.add_space(8.0);

        // Expense summary card - red style
        egui::Frame::none()
            .fill(Color32::from_rgb(254, 242, 242))
            .rounding(Rounding::same(12.0))
            .inner_margin(egui::Margin::symmetric(14.0, 12.0))
            .show(ui, |ui| {
                ui.horizontal(|ui| {
                    // Red indicator dot
                    let (rect, _) = ui.allocate_exact_size(Vec2::splat(10.0), egui::Sense::hover());
                    ui.painter().circle_filled(
                        rect.center(),
                        5.0,
                        Color32::from_rgb(239, 68, 68),
                    );
                    ui.add_space(8.0);
                    ui.label(
                        RichText::new("Total Spent")
                            .size(13.0)
                            .color(Color32::from_rgb(127, 29, 29)),
                    );
                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        ui.label(
                            RichText::new(format!("-${:.2}", total_expenses))
                                .size(16.0)
                                .color(Color32::from_rgb(220, 38, 38))
                                .strong(),
                        );
                    });
                });
            });
    });

    edit_clicked
}
