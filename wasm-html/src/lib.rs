mod utils;

use js_sys::{Array, Reflect};
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    fn alert(s: &str);

// pub type Quacks;

// #[wasm_bindgen(structural, method)]
// pub fn raw(this: &Quacks) -> [str];
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm-html!");
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    utils::set_panic_hook();
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

pub struct Template {}

#[wasm_bindgen]
pub fn html(
    call_site: JsValue,
    subst0: JsValue,
    subst1: JsValue,
    subst2: JsValue,
    subst3: JsValue,
    subst4: JsValue,
    subst5: JsValue,
    subst6: JsValue,
    subst7: JsValue,
    subst8: JsValue,
    subst9: JsValue,
) -> Vec<JsValue> {
    let mut substitutions = Vec::from([
        subst9, subst8, subst7, subst6, subst5, subst4, subst3, subst2, subst1, subst0,
    ]);
    let raw = Array::from(&Reflect::get(&call_site, &JsValue::from("raw")).unwrap());

    let mut result = Vec::with_capacity((raw.length() * 2) as usize);
    for x in 0..raw.length() {
        let test = raw.get(x);
        result.push(test);
        if let Some(substitution) = substitutions.pop() {
            if substitution != JsValue::UNDEFINED && substitution != JsValue::NULL {
                result.push(substitution);
            }
        }
    }
    // raw.for_each(&mut |x, i, _| {
    //     result.push(x);
    //     if let Some(substitution) = substitutions.get_mut(i as usize) {
    //         // result.push(substitution);
    //     }
    // });
    // let test: TemplateStringsArray = call_site;
    // console::log_1(&"Hello world".into());
    return result;
}
