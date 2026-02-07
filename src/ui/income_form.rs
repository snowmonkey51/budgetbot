use egui::{Color32, Key, Margin, RichText, Rounding, Stroke, TextEdit, Vec2};

#[derive(Default)]
pub struct IncomeForm {
    pub is_open: bool,
    pub amount: String,
    request_focus: bool,
}

impl IncomeForm {
    pub fn new() -> Self {
        Self {
            is_open: false,
            amount: String::new(),
            request_focus: false,
        }
    }

    /// Open the form with the current income value
    pub fn open(&mut self, current_income: f64) {
        self.is_open = true;
        self.request_focus = true;
        if current_income > 0.0 {
            self.amount = format!("{:.2}", current_income);
        } else {
            self.amount.clear();
        }
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.request_focus = false;
    }

    /// Returns Some(new_income_amount) if saved, None otherwise
    pub fn render(&mut self, ctx: &egui::Context) -> Option<f64> {
        let mut result = None;

        if !self.is_open {
            return None;
        }

        let mut should_close = false;

        egui::Window::new("Edit Income")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([340.0, 220.0])
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
                    ui.painter().circle_filled(rect.center(), 5.0, Color32::from_rgb(16, 185, 129));
                    ui.add_space(10.0);

                    ui.label(
                        RichText::new("Edit Income")
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

                // Amount field with modern styling
                ui.vertical(|ui| {
                    ui.label(RichText::new("Monthly Income").size(13.0).color(label_color).strong());
                    ui.add_space(8.0);
                    egui::Frame::none()
                        .fill(Color32::from_rgb(249, 250, 251))
                        .rounding(Rounding::same(12.0))
                        .inner_margin(Margin::symmetric(14.0, 14.0))
                        .show(ui, |ui| {
                            ui.horizontal(|ui| {
                                ui.label(RichText::new("$").size(20.0).color(Color32::from_rgb(107, 114, 128)));
                                let text_edit = TextEdit::singleline(&mut self.amount)
                                    .desired_width(220.0)
                                    .hint_text("0.00")
                                    .frame(false)
                                    .font(egui::TextStyle::Heading);
                                let response = ui.add(text_edit);

                                // Request focus when form first opens
                                if self.request_focus {
                                    response.request_focus();
                                    self.request_focus = false;
                                }

                                // Handle Enter key to save
                                if response.lost_focus() && ui.input(|i| i.key_pressed(Key::Enter)) {
                                    if let Ok(amount) = self.amount.parse::<f64>() {
                                        if amount >= 0.0 {
                                            result = Some(amount);
                                            should_close = true;
                                        }
                                    }
                                }
                            });
                        });
                });

                ui.add_space(20.0);

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

                    // Save button
                    let save_btn = egui::Button::new(
                        RichText::new("Save Income").color(Color32::WHITE).size(14.0).strong(),
                    )
                    .fill(Color32::from_rgb(16, 185, 129))
                    .stroke(Stroke::NONE)
                    .rounding(Rounding::same(12.0))
                    .min_size(Vec2::new(140.0, 44.0));

                    if ui.add(save_btn).clicked() {
                        if let Ok(amount) = self.amount.parse::<f64>() {
                            if amount >= 0.0 {
                                result = Some(amount);
                                should_close = true;
                            }
                        }
                    }
                });
            });

        if should_close {
            self.close();
        }

        result
    }
}
