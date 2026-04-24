// ==========================================
// 1. CONFIGURACIÓN DE SUPABASE
// ==========================================
const supabaseUrl = 'https://ohqcnlbeuccfngcgjrdg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ocWNubGJldWNjZm5nY2dqcmRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzE4ODgsImV4cCI6MjA5MjQ0Nzg4OH0.OiajvzVT1MGxjJcy8y5FFn6AozHKEzg0Lx26rISFSX8';

const clienteSupabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Elementos del DOM
const pantallaLogin = document.getElementById('pantalla-login');
const btnLoginGithub = document.getElementById('btn-login-github'); 
const btnLogout = document.getElementById('btn-logout');
const buscador = document.getElementById('buscador');
const btnCargarMas = document.getElementById('btn-cargar-mas');

// Variables de Estado para Paginación
let peliculasBD = []; 
let peliculasAMostrar = [];
let paginaActual = 1; 
let totalPaginas = 1;
const limitePorPagina = 10; // El servidor nos dará de 10 en 10
let baseDatosCargada = false; // Para evitar cargar automáticamente múltiples veces

// ==========================================
// 2. SESIÓN Y AUTENTICACIÓN
// ==========================================
async function revisarSesion() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    
    if (session) {
        pantallaLogin.classList.add('oculto');
        btnLogout.classList.remove('oculto');
        cargarPeliculasBD(); 
    } else {
        pantallaLogin.classList.remove('oculto');
        btnLogout.classList.add('oculto');
        renderizar();
    }
}

clienteSupabase.auth.onAuthStateChange((event, session) => {
    revisarSesion();
});

btnLoginGithub.addEventListener('click', async () => {
    const { error } = await clienteSupabase.auth.signInWithOAuth({ 
        provider: 'github',
        options: { redirectTo: window.location.origin + '/index.html' }
    });
    if (error) console.error("Error de login:", error);
});

btnLogout.addEventListener('click', async () => {
    await clienteSupabase.auth.signOut();
    baseDatosCargada = false; // Resetear para próxima sesión
    location.reload();
});

// ==========================================
// 3. CARGA DE DATOS (PAGINACIÓN REAL)
// ==========================================

async function cargarPeliculasBD() {
    try {
        // Pedimos la página actual al servidor
        const url = `http://localhost:3000/api/movies?page=${paginaActual}&limit=${limitePorPagina}`;
        const respuesta = await fetch(url);
        const data = await respuesta.json();
        
        const nuevasPelis = data.results || [];
        totalPaginas = data.total_pages || 1;

        if (paginaActual === 1) {
            // Si es la primera página, reiniciamos la lista
            peliculasBD = nuevasPelis;
        } else {
            // Si son páginas siguientes, evitamos duplicados por ID y acumulamos
            const idsExistentes = new Set(peliculasBD.map(p => p.id));
            const filtradas = nuevasPelis.filter(p => !idsExistentes.has(p.id));
            peliculasBD = [...peliculasBD, ...filtradas];
        }

        peliculasAMostrar = [...peliculasBD];
        renderizar();

        // Si no hay películas y no se ha cargado automáticamente, cargar ahora
        if (peliculasBD.length === 0 && !baseDatosCargada) {
            cargarPelisAhoraAutomatico();
        }
    } catch (error) {
        console.error("Error al obtener películas:", error);
    }
}

// Botón Rojo (Carga masiva desde TMDB a Supabase)
async function cargarPelisAhora() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (!session) return alert("⚠️ Inicia sesión con GitHub primero.");

    const btnRojo = document.querySelector('button[onclick="cargarPelisAhora()"]');
    if (btnRojo) btnRojo.innerText = 'Cargando... espera';

    try {
        const response = await fetch('http://localhost:3000/api/load/bulk?paginas=10', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert(`✅ ¡Listo! ${data.message}`);
            paginaActual = 1;
            baseDatosCargada = true; // Marcar como cargada
            cargarPeliculasBD();
        } else {
            alert("❌ Error: " + (data.error || "Error desconocido"));
        }
    } catch (error) {
        alert("No se pudo conectar al backend. ¿Está encendido el servidor?");
    } finally {
        if (btnRojo) btnRojo.innerText = '¡LLENAR BASE DE DATOS!';
    }
}

// Carga automática de películas si la BD está vacía
async function cargarPelisAhoraAutomatico() {
    const { data: { session } } = await clienteSupabase.auth.getSession();
    if (!session) return; // No alert, solo salir

    try {
        const response = await fetch('http://localhost:3000/api/load/bulk?paginas=10', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Películas cargadas automáticamente: ${data.message}`);
            baseDatosCargada = true; // Marcar como cargada
            paginaActual = 1;
            cargarPeliculasBD(); // Recargar para mostrar las películas
        } else {
            console.error("Error al cargar películas automáticamente:", data.error);
        }
    } catch (error) {
        console.error("No se pudo conectar al backend para carga automática:", error);
    }
}

// ==========================================
// 4. RENDERIZADO Y FILTROS
// ==========================================

function renderizar() {
    const contenedor = document.getElementById('contenedor-peliculas');
    const mensajeVacio = document.getElementById('mensaje-vacio');
    
    contenedor.innerHTML = '';

    if (peliculasAMostrar.length === 0) {
        mensajeVacio.classList.remove('oculto');
    } else {
        mensajeVacio.classList.add('oculto');
    }

    peliculasAMostrar.forEach(peli => {
        const card = `
            <div class="tarjeta" onclick="abrirDetalle(${peli.id})">
                <img src="${peli.poster_url}" alt="${peli.title}">
                <div class="tarjeta-info">
                    <h3>${peli.title}</h3>
                    <p>${peli.year}</p>
                </div>
            </div>`;
        contenedor.innerHTML += card;
    });

    // Lógica del botón Cargar Más
    // Solo aparece si la página actual es menor al total de páginas del servidor
    if (paginaActual < totalPaginas) {
        btnCargarMas.classList.remove('oculto');
    } else {
        btnCargarMas.classList.add('oculto');
    }
}

// Evento del Buscador (Filtro local sobre lo ya cargado)
buscador.addEventListener('input', (e) => {
    const busqueda = e.target.value.toLowerCase();
    peliculasAMostrar = peliculasBD.filter(p => 
        (p.title || "").toLowerCase().includes(busqueda)
    );
    renderizar();
});

// Evento Botón Cargar Más
btnCargarMas.addEventListener('click', () => {
    if (paginaActual >= totalPaginas) return; // Evitar clics inválidos
    paginaActual++; // Pedimos la siguiente página al Backend
    cargarPeliculasBD();
});

// ==========================================
// 5. MODAL DE DETALLES
// ==========================================
window.abrirDetalle = function(id) {
    const peli = peliculasBD.find(p => p.id === id);
    if(peli) {
        document.getElementById('modal-titulo').innerText = peli.title;
        document.getElementById('modal-anio').innerText = peli.year;
        document.getElementById('modal-sinopsis').innerText = peli.overview || "Sin descripción disponible.";
        document.getElementById('modal-poster').src = peli.poster_url;
        document.getElementById('modal-detalle').style.display = 'flex';
    }
}

window.cerrarModal = function() {
    document.getElementById('modal-detalle').style.display = 'none';
}

// Inicialización
revisarSesion();