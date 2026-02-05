use egui::{Color32, Margin, RichText, Rounding, Stroke, Vec2};

pub struct Calculator {
    pub is_open: bool,
    display: String,
    current_value: f64,
    pending_operation: Option<Operation>,
    pending_value: f64,
    just_calculated: bool,
}

#[derive(Clone, Copy)]
enum Operation {
    Add,
    Subtract,
    Multiply,
    Divide,
}

impl Default for Calculator {
    fn default() -> Self {
        Self::new()
    }
}

impl Calculator {
    pub fn new() -> Self {
        Self {
            is_open: false,
            display: "0".to_string(),
            current_value: 0.0,
            pending_operation: None,
            pending_value: 0.0,
            just_calculated: false,
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
    }

    pub fn close(&mut self) {
        self.is_open = false;
    }

    fn clear(&mut self) {
        self.display = "0".to_string();
        self.current_value = 0.0;
        self.pending_operation = None;
        self.pending_value = 0.0;
        self.just_calculated = false;
    }

    fn input_digit(&mut self, digit: &str) {
        if self.just_calculated {
            self.display = digit.to_string();
            self.just_calculated = false;
        } else if self.display == "0" && digit != "." {
            self.display = digit.to_string();
        } else if digit == "." && self.display.contains('.') {
            // Don't add another decimal point
        } else {
            self.display.push_str(digit);
        }
        self.current_value = self.display.parse().unwrap_or(0.0);
    }

    fn set_operation(&mut self, op: Operation) {
        if self.pending_operation.is_some() && !self.just_calculated {
            self.calculate();
        }
        self.pending_value = self.current_value;
        self.pending_operation = Some(op);
        self.just_calculated = true;
    }

    fn calculate(&mut self) {
        if let Some(op) = self.pending_operation {
            let result = match op {
                Operation::Add => self.pending_value + self.current_value,
                Operation::Subtract => self.pending_value - self.current_value,
                Operation::Multiply => self.pending_value * self.current_value,
                Operation::Divide => {
                    if self.current_value != 0.0 {
                        self.pending_value / self.current_value
                    } else {
                        0.0 // Avoid division by zero
                    }
                }
            };
            self.current_value = result;
            self.display = format_number(result);
            self.pending_operation = None;
            self.just_calculated = true;
        }
    }

    fn backspace(&mut self) {
        if self.display.len() > 1 {
            self.display.pop();
        } else {
            self.display = "0".to_string();
        }
        self.current_value = self.display.parse().unwrap_or(0.0);
    }

    fn negate(&mut self) {
        self.current_value = -self.current_value;
        self.display = format_number(self.current_value);
    }

    pub fn render(&mut self, ctx: &egui::Context) {
        if !self.is_open {
            return;
        }

        egui::Window::new("Calculator")
            .collapsible(false)
            .resizable(false)
            .anchor(egui::Align2::CENTER_CENTER, [0.0, 0.0])
            .fixed_size([280.0, 340.0])
            .frame(
                egui::Frame::none()
                    .fill(Color32::WHITE)
                    .rounding(Rounding::same(16.0))
                    .stroke(Stroke::new(1.0, Color32::from_rgb(220, 220, 230)))
                    .inner_margin(Margin::same(20.0))
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
                            RichText::new("Calculator")
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

                    // Button grid dimensions
                    let button_size = Vec2::new(54.0, 44.0);
                    let spacing = 8.0;
                    let total_width = button_size.x * 4.0 + spacing * 3.0; // 240px

                    // Display - matches button grid width, single row height
                    let (display_rect, _) = ui.allocate_exact_size(
                        Vec2::new(total_width, 32.0),
                        egui::Sense::hover(),
                    );
                    ui.painter().rect_filled(
                        display_rect,
                        Rounding::same(6.0),
                        Color32::from_rgb(245, 247, 250),
                    );
                    ui.painter().text(
                        display_rect.right_center() - Vec2::new(10.0, 0.0),
                        egui::Align2::RIGHT_CENTER,
                        &self.display,
                        egui::FontId::new(18.0, egui::FontFamily::Monospace),
                        Color32::from_rgb(17, 24, 39),
                    );

                    ui.add_space(8.0);

                    // Button grid
                    ui.spacing_mut().item_spacing = Vec2::new(spacing, spacing);

                    // Row 1: C, +/-, ←, ÷
                    ui.horizontal(|ui| {
                        if calc_button(ui, "C", button_size, ButtonStyle::Function).clicked() {
                            self.clear();
                        }
                        if calc_button(ui, "+/-", button_size, ButtonStyle::Function).clicked() {
                            self.negate();
                        }
                        if calc_button(ui, "←", button_size, ButtonStyle::Function).clicked() {
                            self.backspace();
                        }
                        if calc_button(ui, "÷", button_size, ButtonStyle::Operator).clicked() {
                            self.set_operation(Operation::Divide);
                        }
                    });

                    // Row 2: 7, 8, 9, ×
                    ui.horizontal(|ui| {
                        if calc_button(ui, "7", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("7");
                        }
                        if calc_button(ui, "8", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("8");
                        }
                        if calc_button(ui, "9", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("9");
                        }
                        if calc_button(ui, "×", button_size, ButtonStyle::Operator).clicked() {
                            self.set_operation(Operation::Multiply);
                        }
                    });

                    // Row 3: 4, 5, 6, -
                    ui.horizontal(|ui| {
                        if calc_button(ui, "4", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("4");
                        }
                        if calc_button(ui, "5", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("5");
                        }
                        if calc_button(ui, "6", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("6");
                        }
                        if calc_button(ui, "-", button_size, ButtonStyle::Operator).clicked() {
                            self.set_operation(Operation::Subtract);
                        }
                    });

                    // Row 4: 1, 2, 3, +
                    ui.horizontal(|ui| {
                        if calc_button(ui, "1", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("1");
                        }
                        if calc_button(ui, "2", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("2");
                        }
                        if calc_button(ui, "3", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit("3");
                        }
                        if calc_button(ui, "+", button_size, ButtonStyle::Operator).clicked() {
                            self.set_operation(Operation::Add);
                        }
                    });

                    // Row 5: 0 (wide), ., =
                    ui.horizontal(|ui| {
                        let wide_size = Vec2::new(button_size.x * 2.0 + spacing, button_size.y);
                        if calc_button(ui, "0", wide_size, ButtonStyle::Number).clicked() {
                            self.input_digit("0");
                        }
                        if calc_button(ui, ".", button_size, ButtonStyle::Number).clicked() {
                            self.input_digit(".");
                        }
                        if calc_button(ui, "=", button_size, ButtonStyle::Equals).clicked() {
                            self.calculate();
                        }
                    });
                });
            });
    }
}

fn format_number(n: f64) -> String {
    if n.fract() == 0.0 && n.abs() < 1e10 {
        format!("{:.0}", n)
    } else {
        let formatted = format!("{:.8}", n);
        formatted.trim_end_matches('0').trim_end_matches('.').to_string()
    }
}

enum ButtonStyle {
    Number,
    Operator,
    Function,
    Equals,
}

fn calc_button(ui: &mut egui::Ui, label: &str, size: Vec2, style: ButtonStyle) -> egui::Response {
    let (fill, text_color, stroke_color) = match style {
        ButtonStyle::Number => (
            Color32::from_rgb(255, 255, 255),
            Color32::from_rgb(17, 24, 39),
            Color32::from_rgb(230, 232, 240),
        ),
        ButtonStyle::Operator => (
            Color32::from_rgb(238, 242, 255),
            Color32::from_rgb(99, 102, 241),
            Color32::from_rgb(199, 210, 254),
        ),
        ButtonStyle::Function => (
            Color32::from_rgb(243, 244, 246),
            Color32::from_rgb(75, 85, 99),
            Color32::from_rgb(220, 220, 230),
        ),
        ButtonStyle::Equals => (
            Color32::from_rgb(99, 102, 241),
            Color32::WHITE,
            Color32::from_rgb(79, 82, 221),
        ),
    };

    let btn = egui::Button::new(RichText::new(label).size(18.0).color(text_color).strong())
        .fill(fill)
        .stroke(Stroke::new(1.0, stroke_color))
        .rounding(Rounding::same(10.0))
        .min_size(size);

    ui.add(btn)
}
