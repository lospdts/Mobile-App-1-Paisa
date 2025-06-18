use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tiny_http::{Header, Response, Server};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Challenge {
    id: String,
    title: String,
    description: String,
    points: i32,
    type_: String,
    icon: String,
    start_date: String,
    end_date: String,
    participants: Vec<String>,
    completed_by: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct User {
    id: String,
    username: String,
    email: String,
    points: i32,
    level: i32,
    interests: Vec<String>,
    completed_challenges: Vec<String>,
    profile_icon: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Feature {
    id: String,
    name: String,
    description: String,
    status: String,
    priority: String,
    assigned_to: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    email: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginResponse {
    token: String,
}

struct ServerState {
    challenges: Arc<Mutex<Vec<Challenge>>>,
    users: Arc<Mutex<Vec<User>>>,
    features: Arc<Mutex<Vec<Feature>>>,
    data_dir: String,
    running: AtomicBool,
}

impl ServerState {
    fn new() -> Self {
        let data_dir = "../data".to_string();
        fs::create_dir_all(&data_dir).unwrap();

        let challenges = load_or_create_json(&data_dir, "challenges.json", Vec::new());
        let users = load_or_create_json(&data_dir, "users.json", Vec::new());
        let features = load_or_create_json(&data_dir, "features.json", Vec::new());

        ServerState {
            challenges: Arc::new(Mutex::new(challenges)),
            users: Arc::new(Mutex::new(users)),
            features: Arc::new(Mutex::new(features)),
            data_dir,
            running: AtomicBool::new(true),
        }
    }

    fn save_data(&self) {
        let challenges = self.challenges.lock().unwrap();
        let users = self.users.lock().unwrap();
        let features = self.features.lock().unwrap();

        save_json(&self.data_dir, "challenges.json", &*challenges);
        save_json(&self.data_dir, "users.json", &*users);
        save_json(&self.data_dir, "features.json", &*features);
    }
}

fn load_or_create_json<T: for<'de> serde::Deserialize<'de> + serde::Serialize>(data_dir: &str, filename: &str, default: T) -> T {
    let file_path = format!("{}/{}", data_dir, filename);
    match File::open(&file_path) {
        Ok(mut file) => {
            let mut contents = String::new();
            file.read_to_string(&mut contents).unwrap();
            serde_json::from_str(&contents).unwrap_or(default)
        }
        Err(_) => {
            let file = File::create(&file_path).unwrap();
            serde_json::to_writer_pretty(file, &default).unwrap();
            default
        }
    }
}

fn save_json<T: serde::Serialize>(data_dir: &str, filename: &str, data: &T) {
    let file_path = format!("{}/{}", data_dir, filename);
    let file = File::create(&file_path).unwrap();
    serde_json::to_writer_pretty(file, data).unwrap();
}

fn add_cors_headers(response: Response<std::io::Cursor<Vec<u8>>>) -> Response<std::io::Cursor<Vec<u8>>> {
    response
        .with_header(Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap())
        .with_header(Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, PUT, DELETE, OPTIONS"[..]).unwrap())
        .with_header(Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap())
}

fn handle_api_request(state: &ServerState, request: &mut tiny_http::Request) -> Response<std::io::Cursor<Vec<u8>>> {
    let method = request.method().clone();
    let path = request.url().to_string();
    
    println!("Handling API request: {} {}", method, path);

    // Read request body if needed
    let body = if method == tiny_http::Method::Post || method == tiny_http::Method::Put {
        let mut body = String::new();
        request.as_reader().read_to_string(&mut body).unwrap();
        Some(body)
    } else {
        None
    };

    let response = match (method, path.as_str()) {
        (tiny_http::Method::Get, "/api/challenges") => {
            let challenges = state.challenges.lock().unwrap();
            let response = serde_json::to_string(&*challenges).unwrap();
            Response::from_string(response)
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Post, "/api/challenges") => {
            let mut challenges = state.challenges.lock().unwrap();
            let new_challenge: Challenge = serde_json::from_str(&body.unwrap()).unwrap();
            challenges.push(new_challenge);
            save_json(&state.data_dir, "challenges.json", &*challenges);
            Response::from_string(serde_json::to_string(&*challenges).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Put, path) if path.starts_with("/api/challenges/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut challenges = state.challenges.lock().unwrap();
            let updated_challenge: Challenge = serde_json::from_str(&body.unwrap()).unwrap();
            if let Some(challenge) = challenges.iter_mut().find(|c| c.id == id) {
                *challenge = updated_challenge;
                save_json(&state.data_dir, "challenges.json", &*challenges);
                Response::from_string(serde_json::to_string(&*challenges).unwrap())
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            } else {
                Response::from_string("{\"error\":\"Challenge not found\"}")
                    .with_status_code(404)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            }
        }
        (tiny_http::Method::Delete, path) if path.starts_with("/api/challenges/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut challenges = state.challenges.lock().unwrap();
            challenges.retain(|c| c.id != id);
            save_json(&state.data_dir, "challenges.json", &*challenges);
            Response::from_string(serde_json::to_string(&*challenges).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Get, "/api/users") => {
            let users = state.users.lock().unwrap();
            let response = serde_json::to_string(&*users).unwrap();
            Response::from_string(response)
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Post, "/api/users") => {
            let mut users = state.users.lock().unwrap();
            let new_user: User = serde_json::from_str(&body.unwrap()).unwrap();
            users.push(new_user);
            save_json(&state.data_dir, "users.json", &*users);
            Response::from_string(serde_json::to_string(&*users).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Put, path) if path.starts_with("/api/users/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut users = state.users.lock().unwrap();
            let updated_user: User = serde_json::from_str(&body.unwrap()).unwrap();
            if let Some(user) = users.iter_mut().find(|u| u.id == id) {
                *user = updated_user;
                save_json(&state.data_dir, "users.json", &*users);
                Response::from_string(serde_json::to_string(&*users).unwrap())
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            } else {
                Response::from_string("{\"error\":\"User not found\"}")
                    .with_status_code(404)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            }
        }
        (tiny_http::Method::Delete, path) if path.starts_with("/api/users/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut users = state.users.lock().unwrap();
            users.retain(|u| u.id != id);
            save_json(&state.data_dir, "users.json", &*users);
            Response::from_string(serde_json::to_string(&*users).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Get, "/api/features") => {
            let features = state.features.lock().unwrap();
            let response = serde_json::to_string(&*features).unwrap();
            Response::from_string(response)
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Post, "/api/features") => {
            let mut features = state.features.lock().unwrap();
            let new_feature: Feature = serde_json::from_str(&body.unwrap()).unwrap();
            features.push(new_feature);
            save_json(&state.data_dir, "features.json", &*features);
            Response::from_string(serde_json::to_string(&*features).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Put, path) if path.starts_with("/api/features/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut features = state.features.lock().unwrap();
            let updated_feature: Feature = serde_json::from_str(&body.unwrap()).unwrap();
            if let Some(feature) = features.iter_mut().find(|f| f.id == id) {
                *feature = updated_feature;
                save_json(&state.data_dir, "features.json", &*features);
                Response::from_string(serde_json::to_string(&*features).unwrap())
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            } else {
                Response::from_string("{\"error\":\"Feature not found\"}")
                    .with_status_code(404)
                    .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
            }
        }
        (tiny_http::Method::Delete, path) if path.starts_with("/api/features/") => {
            let id = path.split('/').nth(3).unwrap();
            let mut features = state.features.lock().unwrap();
            features.retain(|f| f.id != id);
            save_json(&state.data_dir, "features.json", &*features);
            Response::from_string(serde_json::to_string(&*features).unwrap())
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Post, "/api/auth/login") => {
            println!("Handling login request");
            let login_req: LoginRequest = serde_json::from_str(&body.unwrap()).unwrap();
            // For demo purposes, accept any email/password
            let token = "demo_token_123";
            let response = serde_json::to_string(&LoginResponse { token: token.to_string() }).unwrap();
            Response::from_string(response)
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        (tiny_http::Method::Post, "/api/auth/logout") => {
            Response::from_string("{\"success\":true}")
                .with_header(Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap())
        }
        _ => {
            let response = format!("Not found: {}", path);
            Response::from_string(response).with_status_code(404)
        }
    };

    add_cors_headers(response)
}

fn main() {
    let server = Server::http("0.0.0.0:3000").unwrap();
    let state = Arc::new(ServerState::new());
    
    println!("Server is running...");

    for mut request in server.incoming_requests() {
        let state = Arc::clone(&state);
        
        // Handle CORS preflight requests
        if *request.method() == tiny_http::Method::Options {
            let response = Response::empty(200)
                .with_header(Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap())
                .with_header(Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, PUT, DELETE, OPTIONS"[..]).unwrap())
                .with_header(Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap());
            request.respond(response).unwrap();
            continue;
        }

        // Add CORS headers to all responses
        let mut response = if request.url().starts_with("/api/") {
            handle_api_request(&state, &mut request)
        } else {
            let file_path = format!("../public{}", request.url());
            match File::open(&file_path) {
                Ok(mut file) => {
                    let mut contents = Vec::new();
                    file.read_to_end(&mut contents).unwrap();
                    Response::from_data(contents)
                }
                Err(e) => {
                    println!("Error reading file {}: {}", file_path, e);
                    Response::from_string("File not found").with_status_code(404)
                }
            }
        };

        response = response
            .with_header(Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap())
            .with_header(Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, PUT, DELETE, OPTIONS"[..]).unwrap())
            .with_header(Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type"[..]).unwrap());

        request.respond(response).unwrap();
    }
}
