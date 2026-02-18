// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, State, Window};
use std::sync::{Arc, Mutex};
use parking_lot::RwLock;
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use log::{info, error};

// High-performance shared state using parking_lot and dashmap
#[derive(Default)]
struct AppState {
    websocket_connections: Arc<DashMap<String, bool>>,
    message_cache: Arc<RwLock<Vec<CachedMessage>>>,
    user_status: Arc<RwLock<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct CachedMessage {
    id: String,
    content: String,
    timestamp: i64,
}

// Native optimized commands
#[tauri::command]
async fn cache_messages(
    state: State<'_, Arc<Mutex<AppState>>>,
    messages: Vec<CachedMessage>,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let mut cache = state.message_cache.write();
    
    // Efficient bulk insertion
    cache.extend(messages);
    
    // Keep only last 1000 messages in memory
    if cache.len() > 1000 {
        cache.drain(0..cache.len() - 1000);
    }
    
    Ok(())
}

#[tauri::command]
async fn get_cached_messages(
    state: State<'_, Arc<Mutex<AppState>>>,
    limit: usize,
) -> Result<Vec<CachedMessage>, String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let cache = state.message_cache.read();
    
    let start = cache.len().saturating_sub(limit);
    Ok(cache[start..].to_vec())
}

#[tauri::command]
async fn update_presence(
    state: State<'_, Arc<Mutex<AppState>>>,
    status: String,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    let mut user_status = state.user_status.write();
    *user_status = status;
    Ok(())
}

#[tauri::command]
async fn register_websocket(
    state: State<'_, Arc<Mutex<AppState>>>,
    connection_id: String,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.websocket_connections.insert(connection_id, true);
    info!("WebSocket registered");
    Ok(())
}

#[tauri::command]
async fn unregister_websocket(
    state: State<'_, Arc<Mutex<AppState>>>,
    connection_id: String,
) -> Result<(), String> {
    let state = state.lock().map_err(|e| e.to_string())?;
    state.websocket_connections.remove(&connection_id);
    info!("WebSocket unregistered");
    Ok(())
}

// Optimized file operations
mod image_optimizer {
    use anyhow::Context;
    use std::io::Cursor;
    use image::ImageFormat;

    // A wrapper around anyhow::Result to allow easy conversion to the String error type
    // that Tauri commands expect.
    pub type CommandResult<T> = Result<T, String>;
    
    impl<T> From<anyhow::Error> for CommandResult<T> {
        fn from(err: anyhow::Error) -> Self {
            Err(err.to_string())
        }
    }

    pub fn optimize(file_path: String, quality: u8) -> anyhow::Result<Vec<u8>> {
        let data = std::fs::read(&file_path)
            .with_context(|| format!("Failed to read file: {}", file_path))?;
        
        let img = image::load_from_memory(&data)
            .context("Failed to decode image from memory")?;

        let mut buffer = Cursor::new(Vec::new());

        img.write_to(&mut buffer, ImageFormat::Jpeg)
           .context("Failed to encode image as JPEG")?;
        
        Ok(buffer.into_inner())
    }
}

#[tauri::command]
async fn optimize_image(
    window: Window,
    file_path: String,
    quality: u8,
) -> image_optimizer::CommandResult<Vec<u8>> {
    let handle = window.app_handle();

    // Use spawn_blocking for CPU-intensive tasks to avoid blocking the main thread
    let optimized_data = tauri::async_runtime::spawn_blocking(move || {
        handle.emit("image-optimization-progress", 50).ok();
        let result = image_optimizer::optimize(file_path, quality);
        handle.emit("image-optimization-progress", 100).ok();
        result
    }).await??;

    Ok(optimized_data)
}

// System tray and notifications
#[tauri::command]
async fn show_notification(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    use tauri_plugin_notification::NotificationExt;
    
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

// Window management commands
#[tauri::command]
async fn minimize_to_tray(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn restore_from_tray(window: Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

// Performance monitoring
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    use std::env;
    
    Ok(SystemInfo {
        platform: env::consts::OS.to_string(),
        arch: env::consts::ARCH.to_string(),
        cpu_cores: num_cpus::get(),
    })
}

#[derive(Serialize)]
struct SystemInfo {
    platform: String,
    arch: String,
    cpu_cores: usize,
}

fn main() {
    env_logger::init();
    
    let app_state = Arc::new(Mutex::new(AppState::default()));

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            cache_messages,
            get_cached_messages,
            update_presence,
            register_websocket,
            unregister_websocket,
            optimize_image,
            show_notification,
            minimize_to_tray,
            restore_from_tray,
            get_system_info,
        ])
        .setup(|app| {
            info!("Beacon Desktop starting...");
            
            // Set up system tray
            let window = app.get_webview_window("main").unwrap();
            
            #[cfg(target_os = "windows")]
            {
                // Windows-specific optimizations
                use windows::Win32::System::Threading::*;
                unsafe {
                    SetPriorityClass(
                        GetCurrentProcess(),
                        ABOVE_NORMAL_PRIORITY_CLASS,
                    ).ok();
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
