use egui::{Color32, RichText, Rounding, Stroke, Vec2};

use crate::models::ProfileMeta;

/// Actions that can be returned from the profile selector
#[derive(Debug, Clone)]
pub enum ProfileSelectorAction {
    /// Switch to a different profile
    SwitchProfile(String),
    /// Open the profile manager
    OpenManager,
}

/// A dropdown selector for switching between budget profiles
pub struct ProfileSelector {
    popup_open: bool,
}

impl ProfileSelector {
    pub fn new() -> Self {
        Self { popup_open: false }
    }

    /// Render the profile selector dropdown
    /// Returns an action if the user interacted with it
    pub fn render(
        &mut self,
        ui: &mut egui::Ui,
        profiles: &[ProfileMeta],
        current_profile_id: &str,
        width: f32,
    ) -> Option<ProfileSelectorAction> {
        let mut action: Option<ProfileSelectorAction> = None;

        // Find current profile name
        let current_name = profiles
            .iter()
            .find(|p| p.id == current_profile_id)
            .map(|p| p.name.as_str())
            .unwrap_or("Main Budget");

        let popup_id = ui.make_persistent_id("profile_selector_popup");

        // Button styled to match Add Expense and Templates buttons
        let button = egui::Button::new(
            RichText::new(current_name)
                .size(15.0)
                .color(Color32::from_rgb(99, 102, 241))
                .strong(),
        )
        .fill(Color32::from_rgb(238, 242, 255))
        .stroke(Stroke::new(1.0, Color32::from_rgb(199, 210, 254)))
        .rounding(Rounding::same(14.0))
        .min_size(Vec2::new(width, 50.0));

        let response = ui.add(button)
            .on_hover_text("P: Switch profile | ⌘P: Manage profiles");

        if response.clicked() {
            self.popup_open = !self.popup_open;
        }

        // Show popup below the button
        if self.popup_open {
            let popup_pos = response.rect.left_bottom();

            egui::Area::new(popup_id)
                .fixed_pos(popup_pos)
                .order(egui::Order::Foreground)
                .show(ui.ctx(), |ui| {
                    egui::Frame::none()
                        .fill(Color32::WHITE)
                        .rounding(Rounding::same(12.0))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(229, 231, 235)))
                        .inner_margin(egui::Margin::same(8.0))
                        .shadow(egui::epaint::Shadow {
                            spread: 0.0,
                            blur: 16.0,
                            color: Color32::from_black_alpha(25),
                            offset: [0.0, 4.0].into(),
                        })
                        .show(ui, |ui| {
                            ui.set_width(width - 16.0);

                            // List all profiles
                            for profile in profiles {
                                let is_selected = profile.id == current_profile_id;

                                let item_response = ui.add(
                                    egui::Button::new(
                                        RichText::new(&profile.name)
                                            .size(13.0)
                                            .color(if is_selected {
                                                Color32::from_rgb(99, 102, 241)
                                            } else {
                                                Color32::from_rgb(55, 65, 81)
                                            }),
                                    )
                                    .fill(if is_selected {
                                        Color32::from_rgb(238, 242, 255)
                                    } else {
                                        Color32::TRANSPARENT
                                    })
                                    .stroke(Stroke::NONE)
                                    .rounding(Rounding::same(8.0))
                                    .min_size(Vec2::new(width - 32.0, 36.0)),
                                );

                                if item_response.clicked() && !is_selected {
                                    action = Some(ProfileSelectorAction::SwitchProfile(
                                        profile.id.clone(),
                                    ));
                                    self.popup_open = false;
                                } else if item_response.clicked() && is_selected {
                                    self.popup_open = false;
                                }
                            }

                            ui.add_space(4.0);

                            // Divider
                            ui.add(egui::Separator::default().spacing(8.0));

                            // Manage Profiles option
                            let manage_response = ui.add(
                                egui::Button::new(
                                    RichText::new("Manage Profiles...")
                                        .size(12.0)
                                        .color(Color32::from_rgb(107, 114, 128)),
                                )
                                .fill(Color32::TRANSPARENT)
                                .stroke(Stroke::NONE)
                                .rounding(Rounding::same(8.0))
                                .min_size(Vec2::new(width - 32.0, 32.0)),
                            );

                            if manage_response.clicked() {
                                action = Some(ProfileSelectorAction::OpenManager);
                                self.popup_open = false;
                            }
                        });
                });

            // Close popup when clicking outside
            if ui.input(|i| i.pointer.any_click()) && !response.hovered() {
                // Check if click is outside the popup area
                let pointer_pos = ui.input(|i| i.pointer.interact_pos());
                if let Some(pos) = pointer_pos {
                    let popup_rect = egui::Rect::from_min_size(
                        response.rect.left_bottom(),
                        Vec2::new(width, 200.0),
                    );
                    if !popup_rect.contains(pos) && !response.rect.contains(pos) {
                        self.popup_open = false;
                    }
                }
            }
        }

        action
    }
}

impl Default for ProfileSelector {
    fn default() -> Self {
        Self::new()
    }
}

impl ProfileSelector {
    /// Close the popup (useful when switching away from this view)
    pub fn close_popup(&mut self) {
        self.popup_open = false;
    }

    /// Toggle the popup open/closed
    pub fn toggle_popup(&mut self) {
        self.popup_open = !self.popup_open;
    }

    /// Check if popup is open
    pub fn is_popup_open(&self) -> bool {
        self.popup_open
    }
}
