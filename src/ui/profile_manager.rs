use egui::{Color32, Margin, RichText, Rounding, Stroke, TextEdit, Vec2};

use crate::models::ProfileMeta;

/// Actions that can be returned from the profile manager
#[derive(Debug, Clone)]
pub enum ProfileAction {
    /// Create a new profile with the given name
    Create(String),
    /// Duplicate a profile (source_id, new_name)
    Duplicate(String, String),
    /// Rename a profile (profile_id, new_name)
    Rename(String, String),
    /// Delete a profile
    Delete(String),
    /// Switch to a profile
    Switch(String),
}

/// Modal window for managing budget profiles
pub struct ProfileManager {
    pub is_open: bool,
    new_profile_name: String,
    renaming_profile_id: Option<String>,
    renaming_name: String,
    confirm_delete_id: Option<String>,
}

impl ProfileManager {
    pub fn new() -> Self {
        Self {
            is_open: false,
            new_profile_name: String::new(),
            renaming_profile_id: None,
            renaming_name: String::new(),
            confirm_delete_id: None,
        }
    }

    pub fn open(&mut self) {
        self.is_open = true;
        self.clear_state();
    }

    pub fn close(&mut self) {
        self.is_open = false;
        self.clear_state();
    }

    fn clear_state(&mut self) {
        self.new_profile_name.clear();
        self.renaming_profile_id = None;
        self.renaming_name.clear();
        self.confirm_delete_id = None;
    }

    /// Render the profile manager modal
    /// Returns a list of actions to be processed
    pub fn render(
        &mut self,
        ctx: &egui::Context,
        profiles: &[ProfileMeta],
        current_profile_id: &str,
    ) -> Vec<ProfileAction> {
        let mut actions: Vec<ProfileAction> = Vec::new();

        if !self.is_open {
            return actions;
        }

        egui::Window::new("Manage Profiles")
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
                // Header with close button
                ui.horizontal(|ui| {
                    ui.label(
                        RichText::new("Manage Profiles")
                            .size(18.0)
                            .color(Color32::from_rgb(30, 30, 40))
                            .strong(),
                    );

                    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                        let close_btn = egui::Button::new(
                            RichText::new("Close")
                                .size(12.0)
                                .color(Color32::from_rgb(107, 114, 128)),
                        )
                        .fill(Color32::from_rgb(243, 244, 246))
                        .stroke(Stroke::NONE)
                        .rounding(Rounding::same(6.0))
                        .min_size(Vec2::new(50.0, 28.0));

                        if ui.add(close_btn).clicked() {
                            self.close();
                        }
                    });
                });

                ui.add_space(20.0);

                // Create new profile section
                ui.label(
                    RichText::new("Create New Profile")
                        .size(13.0)
                        .color(Color32::from_rgb(100, 100, 110))
                        .strong(),
                );
                ui.add_space(8.0);

                ui.horizontal(|ui| {
                    egui::Frame::none()
                        .fill(Color32::from_rgb(249, 250, 251))
                        .rounding(Rounding::same(10.0))
                        .stroke(Stroke::new(1.0, Color32::from_rgb(229, 231, 235)))
                        .inner_margin(Margin::symmetric(12.0, 10.0))
                        .show(ui, |ui| {
                            ui.add(
                                TextEdit::singleline(&mut self.new_profile_name)
                                    .desired_width(220.0)
                                    .hint_text("Profile name...")
                                    .frame(false),
                            );
                        });

                    ui.add_space(8.0);

                    let can_create = !self.new_profile_name.trim().is_empty();
                    let create_btn = egui::Button::new(
                        RichText::new("Create")
                            .size(13.0)
                            .color(if can_create {
                                Color32::WHITE
                            } else {
                                Color32::from_rgb(180, 180, 180)
                            }),
                    )
                    .fill(if can_create {
                        Color32::from_rgb(16, 185, 129)
                    } else {
                        Color32::from_rgb(220, 220, 225)
                    })
                    .stroke(Stroke::NONE)
                    .rounding(Rounding::same(10.0))
                    .min_size(Vec2::new(80.0, 38.0));

                    if ui.add(create_btn).clicked() && can_create {
                        actions.push(ProfileAction::Create(self.new_profile_name.trim().to_string()));
                        self.new_profile_name.clear();
                    }
                });

                ui.add_space(24.0);

                // Existing profiles list
                ui.label(
                    RichText::new("Your Profiles")
                        .size(13.0)
                        .color(Color32::from_rgb(100, 100, 110))
                        .strong(),
                );
                ui.add_space(8.0);

                egui::ScrollArea::vertical()
                    .max_height(300.0)
                    .show(ui, |ui| {
                        for profile in profiles {
                            let is_current = profile.id == current_profile_id;
                            let is_renaming = self.renaming_profile_id.as_ref() == Some(&profile.id);
                            let is_confirming_delete =
                                self.confirm_delete_id.as_ref() == Some(&profile.id);

                            egui::Frame::none()
                                .fill(if is_current {
                                    Color32::from_rgb(238, 242, 255)
                                } else {
                                    Color32::from_rgb(249, 250, 251)
                                })
                                .rounding(Rounding::same(12.0))
                                .stroke(Stroke::new(
                                    1.0,
                                    if is_current {
                                        Color32::from_rgb(199, 210, 254)
                                    } else {
                                        Color32::from_rgb(229, 231, 235)
                                    },
                                ))
                                .inner_margin(Margin::same(14.0))
                                .show(ui, |ui| {
                                    if is_renaming {
                                        self.render_rename_mode(ui, &profile.id, &mut actions);
                                    } else if is_confirming_delete {
                                        self.render_delete_confirm(
                                            ui,
                                            &profile.id,
                                            &profile.name,
                                            &mut actions,
                                        );
                                    } else {
                                        self.render_profile_row(
                                            ui,
                                            profile,
                                            is_current,
                                            profiles.len(),
                                            &mut actions,
                                        );
                                    }
                                });

                            ui.add_space(8.0);
                        }
                    });
            });

        actions
    }

    fn render_profile_row(
        &mut self,
        ui: &mut egui::Ui,
        profile: &ProfileMeta,
        is_current: bool,
        total_profiles: usize,
        actions: &mut Vec<ProfileAction>,
    ) {
        ui.horizontal(|ui| {
            ui.vertical(|ui| {
                ui.horizontal(|ui| {
                    ui.label(
                        RichText::new(&profile.name)
                            .size(14.0)
                            .color(Color32::from_rgb(17, 24, 39))
                            .strong(),
                    );
                    if is_current {
                        ui.label(
                            RichText::new("(active)")
                                .size(11.0)
                                .color(Color32::from_rgb(99, 102, 241)),
                        );
                    }
                });
                ui.label(
                    RichText::new(format!(
                        "Created: {}",
                        profile.created_at.format("%b %d, %Y")
                    ))
                    .size(11.0)
                    .color(Color32::from_rgb(156, 163, 175)),
                );
            });

            ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                // Delete button (only if not current and more than 1 profile)
                if !is_current && total_profiles > 1 {
                    let del_btn = egui::Button::new(
                        RichText::new("Delete")
                            .size(11.0)
                            .color(Color32::from_rgb(220, 38, 38)),
                    )
                    .fill(Color32::from_rgb(254, 242, 242))
                    .stroke(Stroke::NONE)
                    .rounding(Rounding::same(6.0))
                    .min_size(Vec2::new(50.0, 28.0));

                    if ui.add(del_btn).clicked() {
                        self.confirm_delete_id = Some(profile.id.clone());
                    }

                    ui.add_space(4.0);
                }

                // Rename button
                let rename_btn = egui::Button::new(
                    RichText::new("Rename")
                        .size(11.0)
                        .color(Color32::from_rgb(99, 102, 241)),
                )
                .fill(Color32::from_rgb(238, 242, 255))
                .stroke(Stroke::NONE)
                .rounding(Rounding::same(6.0))
                .min_size(Vec2::new(60.0, 28.0));

                if ui.add(rename_btn).clicked() {
                    self.renaming_profile_id = Some(profile.id.clone());
                    self.renaming_name = profile.name.clone();
                }

                ui.add_space(4.0);

                // Duplicate button
                let dup_btn = egui::Button::new(
                    RichText::new("Duplicate")
                        .size(11.0)
                        .color(Color32::from_rgb(99, 102, 241)),
                )
                .fill(Color32::from_rgb(238, 242, 255))
                .stroke(Stroke::NONE)
                .rounding(Rounding::same(6.0))
                .min_size(Vec2::new(70.0, 28.0));

                if ui.add(dup_btn).clicked() {
                    let new_name = format!("{} (Copy)", profile.name);
                    actions.push(ProfileAction::Duplicate(profile.id.clone(), new_name));
                }

                // Switch button (only if not current)
                if !is_current {
                    ui.add_space(4.0);

                    let switch_btn = egui::Button::new(
                        RichText::new("Switch")
                            .size(11.0)
                            .color(Color32::WHITE),
                    )
                    .fill(Color32::from_rgb(99, 102, 241))
                    .stroke(Stroke::NONE)
                    .rounding(Rounding::same(6.0))
                    .min_size(Vec2::new(60.0, 28.0));

                    if ui.add(switch_btn).clicked() {
                        actions.push(ProfileAction::Switch(profile.id.clone()));
                    }
                }
            });
        });
    }

    fn render_rename_mode(
        &mut self,
        ui: &mut egui::Ui,
        profile_id: &str,
        actions: &mut Vec<ProfileAction>,
    ) {
        ui.horizontal(|ui| {
            egui::Frame::none()
                .fill(Color32::WHITE)
                .rounding(Rounding::same(8.0))
                .stroke(Stroke::new(1.0, Color32::from_rgb(99, 102, 241)))
                .inner_margin(Margin::symmetric(10.0, 8.0))
                .show(ui, |ui| {
                    ui.add(
                        TextEdit::singleline(&mut self.renaming_name)
                            .desired_width(180.0)
                            .frame(false),
                    );
                });

            ui.add_space(8.0);

            // Save button
            let save_btn = egui::Button::new(
                RichText::new("Save")
                    .size(11.0)
                    .color(Color32::WHITE),
            )
            .fill(Color32::from_rgb(16, 185, 129))
            .stroke(Stroke::NONE)
            .rounding(Rounding::same(6.0))
            .min_size(Vec2::new(50.0, 28.0));

            if ui.add(save_btn).clicked() && !self.renaming_name.trim().is_empty() {
                actions.push(ProfileAction::Rename(
                    profile_id.to_string(),
                    self.renaming_name.trim().to_string(),
                ));
                self.renaming_profile_id = None;
                self.renaming_name.clear();
            }

            // Cancel button
            let cancel_btn = egui::Button::new(
                RichText::new("Cancel")
                    .size(11.0)
                    .color(Color32::from_rgb(107, 114, 128)),
            )
            .fill(Color32::from_rgb(243, 244, 246))
            .stroke(Stroke::NONE)
            .rounding(Rounding::same(6.0))
            .min_size(Vec2::new(55.0, 28.0));

            if ui.add(cancel_btn).clicked() {
                self.renaming_profile_id = None;
                self.renaming_name.clear();
            }
        });
    }

    fn render_delete_confirm(
        &mut self,
        ui: &mut egui::Ui,
        profile_id: &str,
        profile_name: &str,
        actions: &mut Vec<ProfileAction>,
    ) {
        ui.vertical(|ui| {
            ui.label(
                RichText::new(format!("Delete \"{}\"?", profile_name))
                    .size(13.0)
                    .color(Color32::from_rgb(220, 38, 38))
                    .strong(),
            );
            ui.add_space(4.0);
            ui.label(
                RichText::new("This action cannot be undone.")
                    .size(11.0)
                    .color(Color32::from_rgb(156, 163, 175)),
            );
            ui.add_space(8.0);

            ui.horizontal(|ui| {
                // Confirm delete button
                let confirm_btn = egui::Button::new(
                    RichText::new("Delete")
                        .size(11.0)
                        .color(Color32::WHITE),
                )
                .fill(Color32::from_rgb(220, 38, 38))
                .stroke(Stroke::NONE)
                .rounding(Rounding::same(6.0))
                .min_size(Vec2::new(60.0, 28.0));

                if ui.add(confirm_btn).clicked() {
                    actions.push(ProfileAction::Delete(profile_id.to_string()));
                    self.confirm_delete_id = None;
                }

                ui.add_space(8.0);

                // Cancel button
                let cancel_btn = egui::Button::new(
                    RichText::new("Cancel")
                        .size(11.0)
                        .color(Color32::from_rgb(107, 114, 128)),
                )
                .fill(Color32::from_rgb(243, 244, 246))
                .stroke(Stroke::NONE)
                .rounding(Rounding::same(6.0))
                .min_size(Vec2::new(55.0, 28.0));

                if ui.add(cancel_btn).clicked() {
                    self.confirm_delete_id = None;
                }
            });
        });
    }
}

impl Default for ProfileManager {
    fn default() -> Self {
        Self::new()
    }
}
