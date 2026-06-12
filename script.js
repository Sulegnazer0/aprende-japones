// ==========================================
// 1. CONTROL DE LA PIZARRA (CAPTURA DE TRAZOS)
// ==========================================
const canvas = document.getElementById('pizarra');
const ctx = canvas.getContext('2d');
const btnLimpiar = document.getElementById('btn-limpiar');

ctx.lineWidth = 6;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.strokeStyle = '#1e293b';

let dibujando = false;

function obtenerPosicion(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (e) => {
    dibujando = true;
    const pos = obtenerPosicion(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
});

canvas.addEventListener('pointermove', (e) => {
    if (!dibujando) return;
    const pos = obtenerPosicion(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
});

canvas.addEventListener('pointerup', () => { dibujando = false; ctx.closePath(); });
canvas.addEventListener('pointerout', () => { dibujando = false; ctx.closePath(); });
btnLimpiar.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });


// ==========================================
// 2. SISTEMA DE APRENDIZAJE Y LECTURA DE EXCEL
// ==========================================
let diccionarioJapones = [];
let caracterActual = null;

// Elementos de la interfaz
const selectorModo = document.getElementById('selector-modo');
const txtTipo = document.getElementById('info-tipo');
const txtSignificado = document.getElementById('texto-significado');
const panelRespuesta = document.getElementById('panel-respuesta');
const btnRevelar = document.getElementById('btn-revelar');
const btnSiguiente = document.getElementById('btn-siguiente');

// Campos de respuesta y sus contenedores
const respCaracter = document.getElementById('resp-caracter');
const respRomaji = document.getElementById('resp-romaji');
const respCategoria = document.getElementById('resp-categoria');

const filaContraparte = document.getElementById('fila-contraparte');
const respContraparte = document.getElementById('resp-contraparte');
const filaPalabra = document.getElementById('fila-palabra');
const respPalabra = document.getElementById('resp-palabra');

const filaId = document.getElementById('fila-id');
const respId = document.getElementById('resp-id');
const filaOnyomi = document.getElementById('fila-onyomi');
const respOnyomi = document.getElementById('resp-onyomi');
const filaKunyomi = document.getElementById('fila-kunyomi');
const respKunyomi = document.getElementById('resp-kunyomi');

function procesarCSV(texto) {
    const lineas = texto.split('\n').filter(linea => linea.trim() !== '');
    if (lineas.length === 0) return [];

    const separador = lineas[0].includes(';') ? ';' : ',';
    const cabeceras = lineas[0].split(separador).map(c => c.trim());
    const resultado = [];

    for (let i = 1; i < lineas.length; i++) {
        const valores = lineas[i].split(separador);
        const caracterObj = {};
        cabeceras.forEach((cabecera, index) => {
            caracterObj[cabecera] = valores[index] ? valores[index].trim() : "";
        });
        resultado.push(caracterObj);
    }
    return resultado;
}

async function cargarDatos() {
    try {
        // TRUCO ANTI-CACHÉ: Agregamos el tiempo exacto a la URL para forzar al celular a descargar los datos frescos.
        const respuesta = await fetch('datos.csv?v=' + new Date().getTime());
        const textoCSV = await respuesta.text();
        
        diccionarioJapones = procesarCSV(textoCSV);
        
        if(diccionarioJapones.length > 0) {
            presentarDesafio();
        } else {
            txtSignificado.innerText = "El archivo Excel está vacío.";
        }
    } catch (error) {
        txtSignificado.innerText = "Error al conectar con datos.csv";
        console.error(error);
    }
}

function presentarDesafio() {
    panelRespuesta.classList.add('oculto');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const modoElegido = selectorModo.value;
    
    // Filtrado de seguridad
    let listaFiltrada = diccionarioJapones;
    if (modoElegido !== 'todos') {
        listaFiltrada = diccionarioJapones.filter(item => (item.tipo || "").toLowerCase() === modoElegido);
    }
    
    if (listaFiltrada.length === 0) {
        txtTipo.innerText = "Aviso";
        txtSignificado.innerText = "No hay datos de esta categoría aún en tu Excel.";
        return;
    }

    const indiceAzar = Math.floor(Math.random() * listaFiltrada.length);
    caracterActual = listaFiltrada[indiceAzar];
    
    txtTipo.innerText = (caracterActual.tipo || "Extra").toUpperCase() + " - " + (caracterActual.categoria || "");
    txtSignificado.innerText = `Dibuja: "${caracterActual.significado}"`;
}

function revelarRespuesta() {
    if (!caracterActual) return;
    
    respCaracter.innerText = caracterActual.caracter || "?";
    respRomaji.innerText = caracterActual.romaji || "-";
    respCategoria.innerText = caracterActual.categoria || "-";
    
    const esKanji = (caracterActual.tipo || "").toLowerCase() === 'kanji';

    if (esKanji) {
        filaId.style.display = 'block';
        filaOnyomi.style.display = 'block';
        filaKunyomi.style.display = 'block';
        respId.innerText = caracterActual.id_jlpt || "N/A";
        respOnyomi.innerText = caracterActual.onyomi || "-";
        respKunyomi.innerText = caracterActual.kunyomi || "-";
        
        filaContraparte.style.display = 'none';
        filaPalabra.style.display = 'none';
    } else {
        filaContraparte.style.display = 'block';
        filaPalabra.style.display = 'block';
        respContraparte.innerText = caracterActual.contraparte || "-";
        respPalabra.innerText = caracterActual.palabra_ejemplo || "-";

        filaId.style.display = 'none';
        filaOnyomi.style.display = 'none';
        filaKunyomi.style.display = 'none';
    }
    
    panelRespuesta.classList.remove('oculto');
}

// Eventos
btnRevelar.addEventListener('click', revelarRespuesta);
btnSiguiente.addEventListener('click', presentarDesafio);
selectorModo.addEventListener('change', presentarDesafio); 

// Arrancar la app
cargarDatos();

// ==========================================
// 3. MODO ESTUDIO Y BUSCADOR (CON MODAL)
// ==========================================

const tabPractica = document.getElementById('tab-practica');
const tabEstudio = document.getElementById('tab-estudio');
const seccionPractica = document.getElementById('seccion-practica');
const seccionEstudio = document.getElementById('seccion-estudio');

const buscadorTexto = document.getElementById('buscador-texto');
const filtroNivel = document.getElementById('filtro-nivel');
const listaDiccionario = document.getElementById('lista-diccionario');

// Referencias de la Ventana Modal
const modalDetalles = document.getElementById('modal-detalles');
const cerrarModal = document.getElementById('cerrar-modal');
const modalCaracter = document.getElementById('modal-caracter');
const modalRomaji = document.getElementById('modal-romaji');
const modalSignificado = document.getElementById('modal-significado');
const modalCategoria = document.getElementById('modal-categoria');

const modalFilaContraparte = document.getElementById('modal-fila-contraparte');
const modalContraparte = document.getElementById('modal-contraparte');
const modalFilaPalabra = document.getElementById('modal-fila-palabra');
const modalPalabra = document.getElementById('modal-palabra');

const modalFilaId = document.getElementById('modal-fila-id');
const modalId = document.getElementById('modal-id');
const modalFilaOnyomi = document.getElementById('modal-fila-onyomi');
const modalOnyomi = document.getElementById('modal-onyomi');
const modalFilaKunyomi = document.getElementById('modal-fila-kunyomi');
const modalKunyomi = document.getElementById('modal-kunyomi');

// Navegación de pestañas
tabPractica.addEventListener('click', () => {
    seccionPractica.classList.remove('oculto');
    seccionEstudio.classList.add('oculto');
    tabPractica.classList.add('activo');
    tabEstudio.classList.remove('activo');
});

tabEstudio.addEventListener('click', () => {
    seccionEstudio.classList.remove('oculto');
    seccionPractica.classList.add('oculto');
    tabEstudio.classList.add('activo');
    tabPractica.classList.remove('activo');
    renderizarDiccionario(); 
});

// Función para abrir la ventana emergente con datos
function abrirModal(item) {
    // 1. Llenar los datos básicos
    modalCaracter.innerText = item.caracter || "?";
    modalRomaji.innerText = item.romaji || "-";
    modalSignificado.innerText = item.significado || "-";
    modalCategoria.innerText = item.categoria || "-";

    // 2. Revisar si es Kanji o Kana para mostrar lo correcto
    const esKanji = (item.tipo || "").toLowerCase() === 'kanji';

    if (esKanji) {
        modalFilaId.style.display = 'block';
        modalFilaOnyomi.style.display = 'block';
        modalFilaKunyomi.style.display = 'block';
        modalId.innerText = item.id_jlpt || "N/A";
        modalOnyomi.innerText = item.onyomi || "-";
        modalKunyomi.innerText = item.kunyomi || "-";
        
        modalFilaContraparte.style.display = 'none';
        modalFilaPalabra.style.display = 'none';
    } else {
        modalFilaContraparte.style.display = 'block';
        modalFilaPalabra.style.display = 'block';
        modalContraparte.innerText = item.contraparte || "-";
        modalPalabra.innerText = item.palabra_ejemplo || "-";

        modalFilaId.style.display = 'none';
        modalFilaOnyomi.style.display = 'none';
        modalFilaKunyomi.style.display = 'none';
    }

    // 3. Mostrar la ventana
    modalDetalles.classList.remove('oculto');
}

// Cerrar ventana modal con la 'X' o tocando fuera
cerrarModal.addEventListener('click', () => modalDetalles.classList.add('oculto'));
window.addEventListener('click', (e) => {
    if (e.target === modalDetalles) modalDetalles.classList.add('oculto');
});

// Función para dibujar las tarjetas de la lista
function renderizarDiccionario() {
    listaDiccionario.innerHTML = ''; 
    const texto = buscadorTexto.value.toLowerCase();
    const categoriaSeleccionada = filtroNivel.value;

    const filtrados = diccionarioJapones.filter(item => {
        const romaji = (item.romaji || "").toLowerCase();
        const significado = (item.significado || "").toLowerCase();
        const categoria = (item.categoria || "");

        const coincideTexto = romaji.includes(texto) || significado.includes(texto);
        const coincideNivel = categoriaSeleccionada === 'todos' || categoria === categoriaSeleccionada;

        return coincideTexto && coincideNivel;
    });

    if(filtrados.length === 0) {
        listaDiccionario.innerHTML = '<p style="grid-column: 1/-1; color: #64748b;">No se encontraron caracteres.</p>';
        return;
    }

    filtrados.forEach(item => {
        const div = document.createElement('div');
        div.className = 'tarjeta-diccionario';
        div.innerHTML = `
            <div class="td-caracter">${item.caracter}</div>
            <div class="td-romaji">${item.romaji}</div>
            <div class="td-significado">${item.significado}</div>
            <div class="td-tipo">${(item.tipo || "").toUpperCase()}</div>
        `;
        
        // --- ¡AQUÍ ESTÁ LA MAGIA! Le decimos que abra el modal al tocarla ---
        div.addEventListener('click', () => abrirModal(item));
        
        listaDiccionario.appendChild(div);
    });
}

buscadorTexto.addEventListener('input', renderizarDiccionario);
filtroNivel.addEventListener('change', renderizarDiccionario);
