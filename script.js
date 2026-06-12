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

// Campos de respuesta y sus contenedores (para ocultarlos dinámicamente)
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
        const respuesta = await fetch('datos.csv');
        const textoCSV = await respuesta.text();
        diccionarioJapones = procesarCSV(textoCSV);
        
        if(diccionarioJapones.length > 0) {
            presentarDesafio();
        }
    } catch (error) {
        txtSignificado.innerText = "Error al conectar con datos.csv";
    }
}

function presentarDesafio() {
    panelRespuesta.classList.add('oculto');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Leer qué opción elegiste en el menú desplegable
    const modoElegido = selectorModo.value;
    
    // 2. Filtrar la base de datos según tu elección
    let listaFiltrada = diccionarioJapones;
    if (modoElegido !== 'todos') {
        listaFiltrada = diccionarioJapones.filter(item => item.tipo.toLowerCase() === modoElegido);
    }
    
    // Si no hay caracteres de esa categoría aún en tu Excel
    if (listaFiltrada.length === 0) {
        txtTipo.innerText = "Aviso";
        txtSignificado.innerText = "No hay datos de esta categoría aún en tu Excel.";
        return;
    }

    // 3. Elegir uno al azar de la lista ya filtrada
    const indiceAzar = Math.floor(Math.random() * listaFiltrada.length);
    caracterActual = listaFiltrada[indiceAzar];
    
    txtTipo.innerText = caracterActual.tipo + " - " + caracterActual.categoria;
    txtSignificado.innerText = `Dibuja: "${caracterActual.significado}"`;
}

function revelarRespuesta() {
    if (!caracterActual) return;
    
    respCaracter.innerText = caracterActual.caracter;
    respRomaji.innerText = caracterActual.romaji;
    respCategoria.innerText = caracterActual.categoria;
    
    // Lógica para mostrar/ocultar información dependiendo de si es Kanji o Kana
    const esKanji = caracterActual.tipo.toLowerCase() === 'kanji';

    if (esKanji) {
        // Mostrar datos de Kanji
        filaId.style.display = 'block';
        filaOnyomi.style.display = 'block';
        filaKunyomi.style.display = 'block';
        respId.innerText = caracterActual.id_jlpt || "N/A";
        respOnyomi.innerText = caracterActual.onyomi || "-";
        respKunyomi.innerText = caracterActual.kunyomi || "-";
        
        // Ocultar datos de Kana
        filaContraparte.style.display = 'none';
        filaPalabra.style.display = 'none';
    } else {
        // Mostrar datos de Kana
        filaContraparte.style.display = 'block';
        filaPalabra.style.display = 'block';
        respContraparte.innerText = caracterActual.contraparte || "-";
        respPalabra.innerText = caracterActual.palabra_ejemplo || "-";

        // Ocultar datos de Kanji
        filaId.style.display = 'none';
        filaOnyomi.style.display = 'none';
        filaKunyomi.style.display = 'none';
    }
    
    panelRespuesta.classList.remove('oculto');
}

// Eventos
btnRevelar.addEventListener('click', revelarRespuesta);
btnSiguiente.addEventListener('click', presentarDesafio);
// Si cambias el selector, lanza un nuevo desafío inmediatamente
selectorModo.addEventListener('change', presentarDesafio); 

cargarDatos();
