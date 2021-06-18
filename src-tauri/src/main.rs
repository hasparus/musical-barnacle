#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::fs;
use std::io;
use serde_yaml as yaml;

type ErrorMessage = String;
type InvocationResult<T> = Result<T, ErrorMessage>;

const APPDATA_FILE: &str = "../appdata.yaml";

#[tauri::command]
fn write_app_state(state: yaml::Value) -> InvocationResult<String> {
  let serialized = yaml::to_string(&state);
  
  match serialized {
    Ok(s) => {
      println!("{}", s);

      match fs::write(APPDATA_FILE, s) {
        Ok(_) => {
          Ok("file written".to_string())
        }   
        Err(err) => {
          Err(format!("{}:{} {}", line!(), column!(), err.to_string()))
        }
      }
    }
    Err(err) => {
      Err(format!("{}:{} {}", line!(), column!(), err.to_string()))
    }
  }
}

// default value for the config file
// see src/core.ts for the type
// todo: sharing types between Rust and TS would be really cool
fn default_app_state() -> yaml::Mapping {
  use yaml::{Mapping, Value};

  let mut map = Mapping::new();
  map.insert(Value::String("events".to_string()), Value::Sequence(vec![]));
  map.insert(Value::String("configFileContents".to_string()), Value::Mapping(Mapping::new()));

  let mut ui_state = Mapping::new();
  ui_state.insert(Value::String("settingsOpen".to_string()), Value::Bool(true));
  map.insert(Value::String("uiState".to_string()), Value::Mapping(ui_state));

  map
}


#[tauri::command]
fn read_app_state() -> InvocationResult<yaml::Value> {
  let contents = fs::read_to_string(APPDATA_FILE);

  match contents {
    Ok(s) => {
      match yaml::from_str(&s) {
        Ok(parsed) => {
          Ok(parsed)
        }
        Err(err) => {
          Err(format!("{}:{} {}", line!(), column!(), err.to_string()))
        }
      }
    }
    Err(err) => {

      if err.kind() == io::ErrorKind::NotFound {
        Ok(yaml::Value::Mapping(default_app_state()))
      } else {
        Err(format!("{}:{} {}", line!(), column!(), err.to_string()))
      }
    }
  }
}


fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![write_app_state, read_app_state])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
