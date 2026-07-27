

function graficarVectoresFuerzaThreeJS(cargasData, contenedorID) {
    console.log("entro a la función grafico con cantidadCargas =", cargasData);

    const contenedor = document.getElementById(contenedorID);
    contenedor.innerHTML = ''; 
    
    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;
    const escena = new THREE.Scene();
    escena.background = new THREE.Color(0x1e1e1e);

    const camara = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 1000);
    camara.position.set(5, 5, 8);

    // ==========================================
    // 1. RENDERIZADOR 3D
    // ==========================================
    const renderizador = new THREE.WebGLRenderer({ antialias: true });
    renderizador.setSize(ancho, alto);
    contenedor.appendChild(renderizador.domElement);

    // ==========================================
    // 2. RENDERIZADOR DE ETIQUETAS HTML (CSS2D)
    // ==========================================
    const etiquetaRenderizador = new THREE.CSS2DRenderer();
    etiquetaRenderizador.setSize(ancho, alto);
    etiquetaRenderizador.domElement.style.position = 'absolute';
    etiquetaRenderizador.domElement.style.top = '0px';
    etiquetaRenderizador.domElement.style.left = '0px';
    etiquetaRenderizador.domElement.style.pointerEvents = 'none'; 
    contenedor.appendChild(etiquetaRenderizador.domElement);

    // ==========================================
    // 3. REFERENCIAS DE LOS EJES CARTESIANOS
    // ==========================================
    const ejesHelper = new THREE.AxesHelper(5); 
    escena.add(ejesHelper);

    // ==========================================
    // AGREGAR NUMERACIÓN A LOS EJES
    // ==========================================
    function crearNumeracionEjes(rangoMaximo, paso) {
        const colores = { x: '#ff4444', y: '#44ff44', z: '#4444ff' };

        for (let i = -rangoMaximo; i <= rangoMaximo; i += paso) {
            if (i === 0) continue; 

            // --- EJE X ---
            const divX = document.createElement('div');
            divX.textContent = i;
            divX.style.color = colores.x;
            divX.style.fontSize = '11px';
            divX.style.fontFamily = 'sans-serif';
            
            const labelX = new THREE.CSS2DObject(divX);
            labelX.position.set(i, -0.2, 0); 
            escena.add(labelX);

            // --- EJE Y ---
            const divY = document.createElement('div');
            divY.textContent = i;
            divY.style.color = colores.y;
            divY.style.fontSize = '11px';
            divY.style.fontFamily = 'sans-serif';
            
            const labelY = new THREE.CSS2DObject(divY);
            labelY.position.set(-0.2, i, 0); 
            escena.add(labelY);

            // --- EJE Z ---
            const divZ = document.createElement('div');
            divZ.textContent = i;
            divZ.style.color = colores.z;
            divZ.style.fontSize = '11px';
            divZ.style.fontFamily = 'sans-serif';
            
            const labelZ = new THREE.CSS2DObject(divZ);
            labelZ.position.set(0, -0.2, i); 
            escena.add(labelZ);
        }
    }

    crearNumeracionEjes(5, 1);

    const controles = new THREE.OrbitControls(camara, renderizador.domElement);
    controles.enableDamping = true;

    // Iluminación
    const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.6);
    escena.add(luzAmbiental);
    const luzDireccional = new THREE.DirectionalLight(0xffffff, 0.8);
    luzDireccional.position.set(10, 20, 15);
    escena.add(luzDireccional);

    const rejilla = new THREE.GridHelper(10, 10, 0x555555, 0x333333);
    rejilla.position.y = -0.01;
    escena.add(rejilla);

    // --- PROCESAR LAS CARGAS ---
    cargasData.forEach(c => {
        // Esfera de la carga
        const geometriaEsfera = new THREE.SphereGeometry(0.15, 32, 32);
        const materialEsfera = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const esferaCarga = new THREE.Mesh(geometriaEsfera, materialEsfera);
        esferaCarga.position.set(c.x, c.y, c.z);
        escena.add(esferaCarga);

        // CREAR LA ETIQUETA "q1", "q2", etc.
        const divEtiqueta = document.createElement('div');
        divEtiqueta.textContent = `q${c.id}`;
        divEtiqueta.style.color = '#ffffff';
        divEtiqueta.style.fontFamily = 'sans-serif';
        divEtiqueta.style.fontWeight = 'bold';
        divEtiqueta.style.fontSize = '14px';
        divEtiqueta.style.padding = '2px 6px';
        divEtiqueta.style.background = 'rgba(0, 0, 0, 0.6)'; 
        divEtiqueta.style.borderRadius = '4px';
        divEtiqueta.style.marginLeft = '25px'; 

        const etiquetaObjeto = new THREE.CSS2DObject(divEtiqueta);
        etiquetaObjeto.position.set(0, 0, 0); 
        esferaCarga.add(etiquetaObjeto); 

        // ==========================================
        // CÁLCULO REDIMENSIONADO DE LA FLECHA (NUEVO)
        // ==========================================
        const origen = new THREE.Vector3(c.x, c.y, c.z);
        const fuerzaVector = new THREE.Vector3(c.fx, c.fy, c.fz);
        const magnitudReal = fuerzaVector.length();

        if (magnitudReal > 0) {
            // LÍMITES EN UNIDADES DE THREE.JS
            const LONGITUD_MINIMA = 0.4; // Para que no desaparezca en fuerzas chicas
            const LONGITUD_MAXIMA = 3.5; // Para que no se desborde del GridHelper

            // Escalado logarítmico: suaviza diferencias masivas de magnitudes
            // Sumamos 1 dentro del logaritmo para evitar valores negativos si la fuerza es < 1
            let longitudVector = LONGITUD_MINIMA + (Math.log10(magnitudReal + 1) * 0.5);

            // Acotamiento estricto por seguridad (Clamping)
            if (longitudVector > LONGITUD_MAXIMA) {
                longitudVector = LONGITUD_MAXIMA;
            }

            const direccion = fuerzaVector.clone().normalize();
            
            // Proporciones dinámicas de la punta de la flecha basándose en su nuevo largo
            const longitudCabeza = longitudVector * 0.25; 
            const anchoCabeza = 0.08;

            const flechaFuerza = new THREE.ArrowHelper(
                direccion, 
                origen, 
                longitudVector, 
                0x00adb5, 
                longitudCabeza, 
                anchoCabeza
            );
            escena.add(flechaFuerza);
        }
    });

    // Bucle de animación
    function animar() {
        requestAnimationFrame(animar);
        controles.update();
        renderizador.render(escena, camara); 
        etiquetaRenderizador.render(escena, camara); 
    }
    
    animar();

    // Ajuste responsivo
    window.addEventListener('resize', () => {
        const nuevoAncho = contenedor.clientWidth;
        const nuevoAlto = contenedor.clientHeight;
        camara.aspect = nuevoAncho / nuevoAlto;
        camara.updateProjectionMatrix();
        renderizador.setSize(nuevoAncho, nuevoAlto);
        etiquetaRenderizador.setSize(nuevoAncho, nuevoAlto);
    });
}

function fuerzaElectrica(puntoAnalizado, cantidadCargas) {
  const numeroDeCarga = parseInt(puntoAnalizado.replace('q', '')); 
  const xAnalizado = parseFloat(document.getElementById("CoordenadaX" + numeroDeCarga).value);
  const yAnalizado = parseFloat(document.getElementById("CoordenadaY" + numeroDeCarga).value);
  const zAnalizado = parseFloat(document.getElementById("CoordenadaZ" + numeroDeCarga).value);
  
  // Limpiamos el contenedor maestro de resultados para la nueva simulación
  const resultadoContenedor = document.getElementById("resultado");
  resultadoContenedor.innerHTML = ''; 

  if (cantidadCargas < 2) {
    resultadoContenedor.innerHTML = `<div class="alert alert-warning">Ingrese al menos 2 cargas para calcular la fuerza eléctrica.</div>`;
    return;
  }

  if (isNaN(parseFloat(document.getElementById(puntoAnalizado).value)) || parseFloat(document.getElementById(puntoAnalizado).value) === 0) {
    resultadoContenedor.innerHTML = `<div class="alert alert-warning">La carga analizada no genera fuerzas sobre sí misma o es inválida.</div>`;
    return;
  }

  var k = 8.99 * Math.pow(10, 9); // Constante de Coulomb
  var fuerzaTotalX = 0;
  var fuerzaTotalY = 0;
  var fuerzaTotalZ = 0;

  // Creamos un array donde guardaremos la información de todas las cargas fijas para el mapa final
  var todasLasCargasMapa = [];

  // Guardamos la carga analizada en el registro (al final le inyectaremos la fuerza neta)
  todasLasCargasMapa.push({ id: numeroDeCarga, x: xAnalizado, y: yAnalizado, z: zAnalizado, fx: 0, fy: 0, fz: 0 });

  // =========================================================
  // ETAPA 1: BUCLE DE ANÁLISIS PAR A PAR (Gráficos individuales)
  // =========================================================
  for (var i = 1; i <= cantidadCargas; i++) {
    if (i === numeroDeCarga) continue; // Saltamos la carga bajo análisis

    const carga = parseFloat(document.getElementById("q" + i).value);
    const exp = parseFloat(document.getElementById("Exponente" + i).value);
    const x = parseFloat(document.getElementById("CoordenadaX" + i).value); 
    const y = parseFloat(document.getElementById("CoordenadaY" + i).value);
    const z = parseFloat(document.getElementById("CoordenadaZ" + i).value);

    if (isNaN(carga) || carga === 0) {
      const divOmitido = document.createElement('div');
      divOmitido.className = "text-secondary small mb-2";
      divOmitido.textContent = `La carga q${i} está vacía o es 0. Se omitió del análisis.`;
      resultadoContenedor.appendChild(divOmitido);
      continue; // Cambiado por 'continue' para que no rompa el bucle entero
    }

    // Guardamos la posición de esta carga de interacción para el gráfico final
    todasLasCargasMapa.push({ id: i, x: x, y: y, z: z, fx: 0, fy: 0, fz: 0 });

    // 🛑 IMPORTANTE: Quitamos Math.abs de las diferencias para conservar la dirección del vector
    var dx = xAnalizado - x; 
    var dy = yAnalizado - y;
    var dz = zAnalizado - z;
    var distancia = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2) + Math.pow(dz, 2));

    if (distancia === 0) continue;

    var cargaAnalizada = parseFloat(document.getElementById(puntoAnalizado).value) * Math.pow(10, parseFloat(document.getElementById("Exponente" + numeroDeCarga).value));
    var cargaInteraccion = carga * Math.pow(10, exp);
    var fuerza = (k * Math.abs(cargaAnalizada * cargaInteraccion)) / Math.pow(distancia, 2);

    // Sentido físico según leyes de signos (Mismo signo repele, distintos atrae)
    const mismoSigno = (cargaAnalizada * cargaInteraccion) > 0;
    const factorSentido = mismoSigno ? 1 : -1;

    // Componentes del vector con dirección real
    var fxInd = fuerza * (dx / distancia) * factorSentido;
    var fyInd = fuerza * (dy / distancia) * factorSentido;
    var fzInd = fuerza * (dz / distancia) * factorSentido;

    // Acumuladores de la sumatoria total
    fuerzaTotalX += fxInd;
    fuerzaTotalY += fyInd;
    fuerzaTotalZ += fzInd;

    // Identificador único para el div de este gráfico individual
    const idDivGraficoIndividual = `grafico_par_q${i}`;

    // Creamos la tarjeta estructural para este análisis par
    const nuevaEtiquetaResultante = document.createElement('div');
    nuevaEtiquetaResultante.classList.add('card', 'bg-dark', 'text-light', 'border-secondary', 'mb-4');
    nuevaEtiquetaResultante.innerHTML = `
      <div class="card-header fw-bold">Interacción Par: Carga q${i} sobre q${numeroDeCarga}</div>
      <div class="card-body">
        <div id="${idDivGraficoIndividual}" style="width: 100%; height: 320px; position: relative;" class="rounded border border-secondary mb-3"></div>
        
        <div class="small p-2 bg-black bg-opacity-25 rounded">
            <div class="mb-1">La componente x de la fuerza es: <strong>${fxInd.toExponential(2)} N</strong></div>
            <div class="mb-1">La componente y de la fuerza es: <strong>${fyInd.toExponential(2)} N</strong></div>
            <div class="mb-1">La componente z de la fuerza es: <strong>${fzInd.toExponential(2)} N</strong></div>
            <div class="mt-2 text-info fw-bold">Fuerza escalar de interacción: ${fuerza.toExponential(2)} N</div>
        </div>
      </div>`;
    
    resultadoContenedor.appendChild(nuevaEtiquetaResultante);

    // Datos del espacio para ESTE renderizado individual: Carga origen estática + Carga destino con flecha parcial
    const datosPuntoIndividual = [
        { id: i, x: x, y: y, z: z, fx: 0, fy: 0, fz: 0 },
        { id: numeroDeCarga, x: xAnalizado, y: yAnalizado, z: zAnalizado, fx: fxInd, fy: fyInd, fz: fzInd }
    ];

    // Graficamos enviando el array y el ID del lienzo específico
    graficarVectoresFuerzaThreeJS(datosPuntoIndividual, idDivGraficoIndividual);
  }

  // =========================================================
  // ETAPA 2: GRÁFICO FINAL (Sumatoria neta de componentes)
  // =========================================================
  const idDivGraficoFinal = `grafico_sumatoria_final`;
  const tarjetaFinal = document.createElement('div');
  tarjetaFinal.classList.add('card', 'bg-dark', 'text-light', 'border-info', 'mt-5', 'mb-4');
  
  var magnitudNetaTotal = Math.sqrt(Math.pow(fuerzaTotalX, 2) + Math.pow(fuerzaTotalY, 2) + Math.pow(fuerzaTotalZ, 2));

  tarjetaFinal.innerHTML = `
    <div class="card-header fw-bold text-info border-info">SISTEMA COMPLETO: VECTOR FUERZA RESULTANTE NETO</div>
    <div class="card-body">
        <div id="${idDivGraficoFinal}" style="width: 100%; height: 480px; position: relative;" class="rounded border border-info mb-3"></div>
        
        <div class="p-3 bg-black bg-opacity-40 rounded border border-secondary">
            <h5 class="text-info fw-bold mb-2">Sumatoria de Fuerzas en q${numeroDeCarga}:</h5>
            <div class="row mb-2">
                <div class="col-md-4"><strong>Σ F_x:</strong> ${fuerzaTotalX.toExponential(2)} N</div>
                <div class="col-md-4"><strong>Σ F_y:</strong> ${fuerzaTotalY.toExponential(2)} N</div>
                <div class="col-md-4"><strong>Σ F_z:</strong> ${fuerzaTotalZ.toExponential(2)} N</div>
            </div>
            <div class="fs-5 text-success fw-bold">MAGNITUD RESULTANTE TOTAL: ${magnitudNetaTotal.toExponential(2)} N</div>
        </div>
    </div>`;
  
  resultadoContenedor.appendChild(tarjetaFinal);

  // Mapeamos el conjunto completo de todas las cargas guardadas: 
  // La analizada tendrá el gran vector de sumatoria total, las demás actuarán solo de fondo como esferas fijas.
  const datosPuntosFinales = todasLasCargasMapa.map(c => {
      if (c.id === numeroDeCarga) {
          return { id: numeroDeCarga, x: c.x, y: c.y, z: c.z, fx: fuerzaTotalX, fy: fuerzaTotalY, fz: fuerzaTotalZ };
      }
      return c; 
  });

  // Renderizamos el escenario macro con todas las cargas distribuidas
  graficarVectoresFuerzaThreeJS(datosPuntosFinales, idDivGraficoFinal);
}
// ==========================================
// FUNCIÓN PARA CONTAR VISITAS
// ==========================================
async function registrarVisita() {
    try {
        // Hacemos la petición a la función que guardaste en api/visitas.js
        const respuesta = await fetch('/api/visitas');
        
        if (!respuesta.ok) {
            throw new Error(`Error en el servidor: ${respuesta.status}`);
        }

        const datos = await respuesta.json();
        console.log(`¡Visita registrada! Eres el visitante número: ${datos.count}`);
        
        // [OPCIONAL] Si quieres mostrar el número en tu página web:
        const elementoHTML = document.getElementById('contador-visitas');
        if (elementoHTML) {
            elementoHTML.textContent = datos.count;
        }

    } catch (error) {
        // Si hay un error (por ejemplo, en tu computadora local porque no existen las llaves),
        // se mostrará este mensaje en la consola sin romper el resto de tu simulador.
        console.warn("No se pudo registrar la visita en este entorno:", error.message);
    }
}

// Le decimos al navegador que ejecute la función apenas termine de cargar la página
document.addEventListener('DOMContentLoaded', registrarVisita);
