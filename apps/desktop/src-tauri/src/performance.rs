use sysinfo::{System, SystemExt, CpuExt};
use tauri::Manager;

pub struct PerformanceConfig {
    pub low_spec_mode: bool,
    pub max_memory_mb: u64,
    pub enable_gpu: bool,
}

impl PerformanceConfig {
    pub fn detect() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();

        // Get total RAM in GB
        let total_memory_gb = sys.total_memory() / 1024 / 1024 / 1024;
        
        // Get CPU count
        let cpu_count = sys.cpus().len();
        
        // Determine if low-spec
        let low_spec_mode = total_memory_gb < 4 || cpu_count < 4;
        
        println!("[Performance] RAM: {}GB, CPUs: {}, Mode: {}", 
            total_memory_gb, 
            cpu_count,
            if low_spec_mode { "Low-spec" } else { "High-spec" }
        );

        PerformanceConfig {
            low_spec_mode,
            max_memory_mb: if low_spec_mode { 256 } else { 512 },
            enable_gpu: !low_spec_mode,
        }
    }

    pub fn apply_to_webview(&self, window: &tauri::Window) {
        if self.low_spec_mode {
            // Disable GPU acceleration on low-spec
            let _ = window.eval(&format!(
                r#"
                document.documentElement.classList.add('low-spec-mode');
                localStorage.setItem('lowSpecMode', 'true');
                console.log('[Tauri] Low-spec optimizations applied');
                "#
            ));
        }
    }
}

#[tauri::command]
pub fn get_performance_config() -> PerformanceConfig {
    PerformanceConfig::detect()
}
