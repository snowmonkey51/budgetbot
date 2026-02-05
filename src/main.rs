#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod app;
mod models;
mod storage;
mod ui;

use app::BudgetApp;

fn main() -> eframe::Result<()> {
    // Load the icon for the dock/taskbar
    let icon = load_icon();

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([850.0, 800.0])
            .with_min_inner_size([600.0, 500.0])
            .with_icon(icon),
        ..Default::default()
    };

    eframe::run_native(
        "Budgetbot",
        options,
        Box::new(|cc| Ok(Box::new(BudgetApp::new(cc)))),
    )
}

fn load_icon() -> egui::IconData {
    // Try to load from various possible locations
    let logo_paths = [
        "assets/logo2.png",
        "../assets/logo2.png",
        "./assets/logo2.png",
        concat!(env!("CARGO_MANIFEST_DIR"), "/assets/logo2.png"),
    ];

    for path in logo_paths {
        if let Ok(image_data) = std::fs::read(path) {
            if let Ok(image) = image::load_from_memory(&image_data) {
                let rgba = image.to_rgba8();
                let (width, height) = rgba.dimensions();
                return egui::IconData {
                    rgba: rgba.into_raw(),
                    width,
                    height,
                };
            }
        }
    }

    // Fallback: return empty icon data
    egui::IconData {
        rgba: vec![],
        width: 0,
        height: 0,
    }
}
