use std::sync::Mutex;

use neon::prelude::*;
use once_cell::sync::Lazy;
use enigo::{
    Direction::{Press, Release},
    Enigo, Key, Keyboard, Settings,
};

static ENIGO: Lazy<Mutex<Enigo>> = Lazy::new(|| {
  Mutex::new(Enigo::new(&Settings::default()).unwrap())
});

fn get_key(js_enum_value: i32) -> Key {
    match js_enum_value {
        0 => Key::Alt,
        1 => Key::Backspace,
        2 => Key::CapsLock,
        3 => Key::Control,
        4 => Key::Delete,
        5 => Key::DownArrow,
        6 => Key::End,
        7 => Key::Escape,
        8 => Key::F1,
        9 => Key::F10,
        10 => Key::F11,
        11 => Key::F12,
        12 => Key::F2,
        13 => Key::F3,
        14 => Key::F4,
        15 => Key::F5,
        16 => Key::F6,
        17 => Key::F7,
        18 => Key::F8,
        19 => Key::F9,
        20 => Key::Home,
        21 => Key::LeftArrow,
        22 => Key::Meta,
        23 => Key::Option,
        24 => Key::PageDown,
        25 => Key::PageUp,
        26 => Key::Return,
        27 => Key::RightArrow,
        28 => Key::Shift,
        29 => Key::Space,
        30 => Key::Tab,
        31 => Key::UpArrow,
        32 => Key::A,
        33 => Key::B,
        34 => Key::C,
        35 => Key::D,
        36 => Key::E,
        37 => Key::F,
        38 => Key::G,
        39 => Key::H,
        40 => Key::I,
        41 => Key::J,
        42 => Key::K,
        43 => Key::L,
        44 => Key::M,
        45 => Key::N,
        46 => Key::O,
        47 => Key::P,
        48 => Key::Q,
        49 => Key::R,
        50 => Key::S,
        51 => Key::T,
        52 => Key::U,
        53 => Key::V,
        54 => Key::W,
        55 => Key::X,
        56 => Key::Y,
        57 => Key::Z,
        _ => unreachable!(),
    }
}

fn key_press(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let direction = match cx.argument::<JsString>(0)?.value(&mut cx).as_str() {
        "down" => Press,
        "up" => Release,
        _ => unreachable!(),
    };

    for arg_idx in 1..cx.len() {
        let key_value = cx.argument::<JsNumber>(arg_idx)?.value(&mut cx) as i32;
        ENIGO.lock().unwrap().key(get_key(key_value), direction).unwrap();
    }

    Ok(cx.undefined())
}

fn key_type(mut cx: FunctionContext) -> JsResult<JsUndefined> {
    let text = cx.argument::<JsString>(0)?.value(&mut cx);
    ENIGO.lock().unwrap().text(&text).unwrap();
    
    Ok(cx.undefined())
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("type", key_type)?;
    cx.export_function("press", key_press)?;
    Ok(())
}
