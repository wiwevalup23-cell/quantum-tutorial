        // --- --- Визуализация Дельта-функции (Билет 1) --- ---
        const deltaCanvas = document.getElementById('deltaCanvas');
        const sigmaSlider = document.getElementById('sigmaSlider');
        const sigmaVal = document.getElementById('sigmaVal');
        const peakVal = document.getElementById('peakVal');

        function drawDelta() {
            if (!deltaCanvas || !sigmaSlider) return;
            const ctx = deltaCanvas.getContext('2d');
            const W = deltaCanvas.width;
            const H = deltaCanvas.height;
            ctx.clearRect(0, 0, W, H);

            const sigma = parseFloat(sigmaSlider.value);
            if (sigmaVal) sigmaVal.innerText = sigma.toFixed(2);
            
            const maxVal = 1 / (Math.sqrt(2 * Math.PI) * sigma);
            if (peakVal) peakVal.innerText = maxVal.toFixed(2);

            // Отрисовка осей
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); // Ось X
            ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); // Ось Y
            ctx.stroke();

            // Отрисовка колокола Гаусса
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = 'rgba(59, 130, 246, 0.4)';
            ctx.shadowBlur = 10;
            ctx.beginPath();

            const scaleX = 200; // пикселей на 1 единицу x
            const scaleY = (H - 50) / 8; // пикселей на 1 единицу y

            for (let px = 0; px < W; px++) {
                const x = (px - W / 2) / scaleX;
                const y = Math.exp(-(x * x) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
                const py = (H - 30) - y * scaleY;
                if (px === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // Сброс блюра
        }

        if (sigmaSlider) {
            sigmaSlider.addEventListener('input', drawDelta);
        }

        // --- --- Визуализация плоской волны (Билет 2) --- ---
        function drawWave() {
            const canvas = document.getElementById('waveCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const W = canvas.width;
            const H = canvas.height;
            
            const kSlider = document.getElementById('kSlider');
            const kVal = document.getElementById('kVal');
            const pVal = document.getElementById('pVal');
            const eVal = document.getElementById('eVal');

            const k = parseFloat(kSlider ? kSlider.value : 2.0);
            
            if(kVal) kVal.innerText = k.toFixed(1);
            if(pVal) pVal.innerText = k.toFixed(1) + ' ħ';
            if(eVal) eVal.innerText = (k*k/2).toFixed(2);

            ctx.clearRect(0, 0, W, H);

            // Отрисовка осей
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); // Ось X
            ctx.stroke();

            // Линия графика волны (вещественная часть)
            ctx.strokeStyle = '#3b82f6'; // Синий
            ctx.lineWidth = 2;
            ctx.beginPath();
            const scaleX = 40;
            const amplitude = 60;
            
            for (let px = 0; px < W; px++) {
                const x = px / scaleX;
                const y = Math.cos(k * x);
                const py = H / 2 - y * amplitude;
                if (px === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            
            // Мнимая часть волны пунктиром
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)'; // Фиолетовый полупрозрачный
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            for (let px = 0; px < W; px++) {
                const x = px / scaleX;
                const y = Math.sin(k * x);
                const py = H / 2 - y * amplitude;
                if (px === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (document.getElementById('kSlider')) {
            document.getElementById('kSlider').addEventListener('input', drawWave);
        }

        // --- --- Симулятор измерения и коллапса ВФ (Билет 3) --- ---
        let collapseCanvas = null;
        let collapseCtx = null;
        let c1 = 0.8, c2 = 0.5, c3 = 0.3;
        
        let isCollapsed = false;
        let collapseType = 'none'; // 'energy', 'position'
        let collapsedLevel = 1;
        let collapsedPos = 0.5;
        
        let isTransitioning = false;
        let transitionT = 0;
        
        // Временные массивы для интерполяции в процессе коллапса
        const gridPointsCount = 200;
        let psiInitialRe = new Float32Array(gridPointsCount + 1);
        let psiInitialIm = new Float32Array(gridPointsCount + 1);
        
        let simTime = 0;
        let simLoopRunning = false;
        const omega1 = 0.5; // Базовая угловая частота

        function initCollapseSim() {
            collapseCanvas = document.getElementById('collapseCanvas');
            if (!collapseCanvas) return;
            collapseCtx = collapseCanvas.getContext('2d');
            
            const c1Slider = document.getElementById('c1Slider');
            const c2Slider = document.getElementById('c2Slider');
            const c3Slider = document.getElementById('c3Slider');
            
            const measureEnergyBtn = document.getElementById('measureEnergyBtn');
            const measurePosBtn = document.getElementById('measurePosBtn');
            const resetCollapseBtn = document.getElementById('resetCollapseBtn');
            
            // Настройка слушателей слайдеров
            const handleSliderChange = () => {
                c1 = parseFloat(c1Slider.value);
                c2 = parseFloat(c2Slider.value);
                c3 = parseFloat(c3Slider.value);
                
                // Предотвращение нулевого вектора
                if (c1 === 0 && c2 === 0 && c3 === 0) {
                    c1 = 0.1;
                    c1Slider.value = 0.1;
                }
                
                document.getElementById('c1Val').innerText = c1.toFixed(2);
                document.getElementById('c2Val').innerText = c2.toFixed(2);
                document.getElementById('c3Val').innerText = c3.toFixed(2);
                
                updateProbabilities();
                resetCollapse();
            };

            if (c1Slider) c1Slider.addEventListener('input', handleSliderChange);
            if (c2Slider) c2Slider.addEventListener('input', handleSliderChange);
            if (c3Slider) c3Slider.addEventListener('input', handleSliderChange);
            
            if (measureEnergyBtn) measureEnergyBtn.onclick = measureEnergy;
            if (measurePosBtn) measurePosBtn.onclick = measurePosition;
            if (resetCollapseBtn) resetCollapseBtn.onclick = resetCollapse;
            
            updateProbabilities();
            
            if (!simLoopRunning) {
                simLoopRunning = true;
                requestAnimationFrame(simLoop);
            }
        }
        
        function updateProbabilities() {
            const normSq = c1*c1 + c2*c2 + c3*c3;
            const p1 = (c1*c1 / normSq) * 100;
            const p2 = (c2*c2 / normSq) * 100;
            const p3 = (c3*c3 / normSq) * 100;
            
            const pE1 = document.getElementById('pE1');
            const pE2 = document.getElementById('pE2');
            const pE3 = document.getElementById('pE3');
            if (pE1) pE1.innerText = p1.toFixed(0) + '%';
            if (pE2) pE2.innerText = p2.toFixed(0) + '%';
            if (pE3) pE3.innerText = p3.toFixed(0) + '%';
        }
        
        function resetCollapse() {
            isCollapsed = false;
            collapseType = 'none';
            isTransitioning = false;
            const status = document.getElementById('measurementStatus');
            if (status) status.innerText = "Система подготовлена в суперпозиции. Ожидание измерения...";
        }
        
        // Собственные функции потенциальной ямы: phi_n(x) = sqrt(2) * sin(n * pi * x)
        function phi(n, x) {
            return Math.sqrt(2) * Math.sin(n * Math.PI * x);
        }
        
        // Получение текущего состояния суперпозиции в точке x и времени t
        function getSuperpositionPsi(x, t) {
            const norm = Math.sqrt(c1*c1 + c2*c2 + c3*c3);
            const a1 = c1 / norm;
            const a2 = c2 / norm;
            const a3 = c3 / norm;
            
            const re = a1 * phi(1, x) * Math.cos(1 * omega1 * t) + 
                       a2 * phi(2, x) * Math.cos(4 * omega1 * t) + 
                       a3 * phi(3, x) * Math.cos(9 * omega1 * t);
                       
            const im = a1 * phi(1, x) * Math.sin(-1 * omega1 * t) + 
                       a2 * phi(2, x) * Math.sin(-4 * omega1 * t) + 
                       a3 * phi(3, x) * Math.sin(-9 * omega1 * t);
                       
            return { re, im };
        }

        function measureEnergy() {
            if (isCollapsed && collapseType === 'energy') {
                const status = document.getElementById('measurementStatus');
                if (status) status.innerText = `Повторное измерение энергии: результат E_${collapsedLevel} (вероятность 100%). Состояние стабильно.`;
                return;
            }
            
            let p1, p2, p3;
            if (isCollapsed && collapseType === 'position') {
                const f1 = 2 * Math.pow(Math.sin(Math.PI * collapsedPos), 2);
                const f2 = 2 * Math.pow(Math.sin(2 * Math.PI * collapsedPos), 2);
                const f3 = 2 * Math.pow(Math.sin(3 * Math.PI * collapsedPos), 2);
                const sum = f1 + f2 + f3;
                p1 = f1 / sum;
                p2 = f2 / sum;
                p3 = f3 / sum;
            } else {
                const normSq = c1*c1 + c2*c2 + c3*c3;
                p1 = (c1*c1 / normSq);
                p2 = (c2*c2 / normSq);
                p3 = (c3*c3 / normSq);
            }
            
            captureCurrentPsi();
            
            const rand = Math.random();
            let chosen = 1;
            let prob = p1;
            
            if (rand < p1) {
                chosen = 1;
                prob = p1;
            } else if (rand < p1 + p2) {
                chosen = 2;
                prob = p2;
            } else {
                chosen = 3;
                prob = p3;
            }
            
            collapsedLevel = chosen;
            isCollapsed = true;
            collapseType = 'energy';
            isTransitioning = true;
            transitionT = 0;
            
            const status = document.getElementById('measurementStatus');
            if (status) status.innerText = `Измерение энергии... Результат: E_${chosen} (вероятность была ${(prob*100).toFixed(0)}%). Состояние редуцировало к собственной функции.`;
        }
        
        function measurePosition() {
            if (isCollapsed && collapseType === 'position') {
                const status = document.getElementById('measurementStatus');
                if (status) status.innerText = `Повторное измерение координаты: результат x = ${collapsedPos.toFixed(3)} (вероятность 100%). Частица локализована.`;
                return;
            }
            
            captureCurrentPsi();
            
            const cdf = new Float32Array(gridPointsCount + 1);
            let sum = 0;
            
            for (let j = 0; j <= gridPointsCount; j++) {
                const x = j / gridPointsCount;
                let psiSq = 0;
                
                if (isCollapsed && collapseType === 'energy') {
                    const val = phi(collapsedLevel, x);
                    psiSq = val * val;
                } else {
                    const psi = getSuperpositionPsi(x, simTime);
                    psiSq = psi.re * psi.re + psi.im * psi.im;
                }
                
                sum += psiSq;
                cdf[j] = sum;
            }
            
            for (let j = 0; j <= gridPointsCount; j++) {
                cdf[j] /= sum;
            }
            
            const rand = Math.random();
            let idx = 0;
            while (idx < gridPointsCount && cdf[idx] < rand) {
                idx++;
            }
            
            const xMeas = idx / gridPointsCount;
            collapsedPos = Math.max(0.04, Math.min(0.96, xMeas));
            
            isCollapsed = true;
            collapseType = 'position';
            isTransitioning = true;
            transitionT = 0;
            
            const status = document.getElementById('measurementStatus');
            if (status) status.innerText = `Измерение координаты... Результат: x = ${collapsedPos.toFixed(3)}. Волновая функция коллапсировала в дельта-подобный пик.`;
        }
        
        function captureCurrentPsi() {
            for (let j = 0; j <= gridPointsCount; j++) {
                const x = j / gridPointsCount;
                const psi = getCurrentPsiAtFrame(x);
                psiInitialRe[j] = psi.re;
                psiInitialIm[j] = psi.im;
            }
        }
        
        function getCurrentPsiAtFrame(x) {
            if (isCollapsed && !isTransitioning) {
                if (collapseType === 'energy') {
                    const val = phi(collapsedLevel, x);
                    const ePhase = collapsedLevel * collapsedLevel * omega1 * simTime;
                    return {
                        re: val * Math.cos(ePhase),
                        im: val * Math.sin(-ePhase)
                    };
                } else {
                    const sigma = 0.035;
                    const peak = Math.exp(-Math.pow(x - collapsedPos, 2) / (2 * sigma * sigma));
                    const norm = 1 / (Math.sqrt(sigma * Math.sqrt(Math.PI)));
                    return {
                        re: peak * norm,
                        im: 0
                    };
                }
            } else if (isTransitioning) {
                const idx = Math.round(x * gridPointsCount);
                const initRe = psiInitialRe[idx];
                const initIm = psiInitialIm[idx];
                
                let targetRe = 0, targetIm = 0;
                if (collapseType === 'energy') {
                    const val = phi(collapsedLevel, x);
                    const ePhase = collapsedLevel * collapsedLevel * omega1 * simTime;
                    targetRe = val * Math.cos(ePhase);
                    targetIm = val * Math.sin(-ePhase);
                } else {
                    const sigma = 0.035;
                    const peak = Math.exp(-Math.pow(x - collapsedPos, 2) / (2 * sigma * sigma));
                    const norm = 1 / (Math.sqrt(sigma * Math.sqrt(Math.PI)));
                    targetRe = peak * norm;
                    targetIm = 0;
                }
                
                const t = transitionT;
                let re = (1 - t) * initRe + t * targetRe;
                let im = (1 - t) * initIm + t * targetIm;
                
                return { re, im };
            } else {
                return getSuperpositionPsi(x, simTime);
            }
        }
        
        function simLoop() {
            if (activeTicket !== 3) {
                simLoopRunning = false;
                return;
            }
            
            simTime += 0.035;
            
            if (isTransitioning) {
                transitionT += 0.04;
                if (transitionT >= 1) {
                    transitionT = 1;
                    isTransitioning = false;
                }
            }
            
            drawCollapseFrame();
            requestAnimationFrame(simLoop);
        }
        
        function drawCollapseFrame() {
            if (!collapseCanvas || !collapseCtx) return;
            const ctx = collapseCtx;
            const W = collapseCanvas.width;
            const H = collapseCanvas.height;
            
            ctx.clearRect(0, 0, W, H);
            
            const leftX = 50;
            const rightX = W - 50;
            const widthX = rightX - leftX;
            const centerY = H / 2;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(leftX, 20);
            ctx.lineTo(leftX, H - 30);
            ctx.lineTo(rightX, H - 30);
            ctx.lineTo(rightX, 20);
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(leftX, centerY);
            ctx.lineTo(rightX, centerY);
            ctx.stroke();
            
            const scaleAmp = 40;
            const scaleProb = 35;
            
            const pxRe = [];
            const pxIm = [];
            const pxSq = [];
            
            let sumSq = 0;
            for (let j = 0; j <= gridPointsCount; j++) {
                const x = j / gridPointsCount;
                const psi = getCurrentPsiAtFrame(x);
                sumSq += (psi.re*psi.re + psi.im*psi.im) / gridPointsCount;
            }
            const normCorrection = Math.sqrt(sumSq > 0.001 ? 1 / sumSq : 1);
            
            for (let j = 0; j <= gridPointsCount; j++) {
                const x = j / gridPointsCount;
                let psi = getCurrentPsiAtFrame(x);
                
                if (isTransitioning) {
                    psi.re *= normCorrection;
                    psi.im *= normCorrection;
                }
                
                const px = leftX + x * widthX;
                
                const yRe = centerY - psi.re * scaleAmp;
                const yIm = centerY - psi.im * scaleAmp;
                const ySq = (H - 30) - (psi.re*psi.re + psi.im*psi.im) * scaleProb;
                
                pxRe.push({x: px, y: yRe});
                pxIm.push({x: px, y: yIm});
                pxSq.push({x: px, y: ySq});
            }
            
            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.beginPath();
            ctx.moveTo(leftX, H - 30);
            for (let j = 0; j <= gridPointsCount; j++) {
                ctx.lineTo(pxSq[j].x, pxSq[j].y);
            }
            ctx.lineTo(rightX, H - 30);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(pxSq[0].x, pxSq[0].y);
            for (let j = 1; j <= gridPointsCount; j++) {
                ctx.lineTo(pxSq[j].x, pxSq[j].y);
            }
            ctx.stroke();
            
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(pxRe[0].x, pxRe[0].y);
            for (let j = 1; j <= gridPointsCount; j++) {
                ctx.lineTo(pxRe[j].x, pxRe[j].y);
            }
            ctx.stroke();
            
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(pxIm[0].x, pxIm[0].y);
            for (let j = 1; j <= gridPointsCount; j++) {
                ctx.lineTo(pxIm[j].x, pxIm[j].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '11px sans-serif';
            ctx.fillText('x = 0', leftX - 10, H - 12);
            ctx.fillText('x = a', rightX - 10, H - 12);
            
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(leftX + 20, 20, 12, 6);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('Re(ψ) — вещ. часть', leftX + 38, 26);
            
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(leftX + 170, 23); ctx.lineTo(leftX + 182, 23);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('Im(ψ) — мним. часть', leftX + 188, 26);
            
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(leftX + 320, 20, 12, 6);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('|ψ|² — плотность вероятности', leftX + 338, 26);
        }

        function drawProb() {
            drawWave(); 
        }

        // --- --- Визуализация Неопределенности Гейзенберга (Билет 4) --- ---
        const heisenbergCanvasX = document.getElementById('heisenbergCanvasX');
        const heisenbergCanvasP = document.getElementById('heisenbergCanvasP');
        const ctxX = heisenbergCanvasX ? heisenbergCanvasX.getContext('2d') : null;
        const ctxP = heisenbergCanvasP ? heisenbergCanvasP.getContext('2d') : null;
        const heisenbergSigmaSlider = document.getElementById('heisenbergSigmaSlider');
        const dxValLabel = document.getElementById('dxVal');
        const dpValLabel = document.getElementById('dpVal');
        const uncValLabel = document.getElementById('uncVal');

        function drawGaussian(ctx, w, h, sigma, color) {
            if (!ctx) return;
            ctx.clearRect(0, 0, w, h);
            
            // Оси
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, h - 20); ctx.lineTo(w, h - 20); // x-axis
            ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); // y-axis
            ctx.stroke();

            // Гауссиана
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            const maxAmp = h - 30;
            
            let visualAmp = (1 / sigma) * 25;
            if (visualAmp > maxAmp) visualAmp = maxAmp;

            for (let px = 0; px <= w; px++) {
                let x = ((px - w/2) / (w/2)) * 4; 
                let y = visualAmp * Math.exp(-(x * x) / (2 * sigma * sigma));
                if (px === 0) ctx.moveTo(px, h - 20 - y);
                else ctx.lineTo(px, h - 20 - y);
            }
            ctx.stroke();
            
            // Заливка под графиком
            ctx.lineTo(w, h - 20);
            ctx.lineTo(0, h - 20);
            ctx.fillStyle = color.replace('1)', '0.15)');
            ctx.fill();
        }

        function updateHeisenberg() {
            if (!ctxX || !ctxP || !heisenbergSigmaSlider) return;
            
            const sigmaX = parseFloat(heisenbergSigmaSlider.value);
            // По соотношению Гейзенберга для когерентного Гауссова пакета: sigma_x * sigma_p = hbar / 2
            // Полагая hbar = 1, получаем sigma_p = 0.5 / sigma_x
            const sigmaP = 0.5 / sigmaX;
            
            if (dxValLabel) dxValLabel.innerText = sigmaX.toFixed(2);
            if (dpValLabel) dpValLabel.innerText = sigmaP.toFixed(2);
            if (uncValLabel) uncValLabel.innerText = (sigmaX * sigmaP).toFixed(2);
            
            if (heisenbergCanvasX) drawGaussian(ctxX, heisenbergCanvasX.width, heisenbergCanvasX.height, sigmaX, 'rgba(59, 130, 246, 1)'); 
            if (heisenbergCanvasP) drawGaussian(ctxP, heisenbergCanvasP.width, heisenbergCanvasP.height, sigmaP, 'rgba(245, 158, 11, 1)'); 
        }

        if (heisenbergSigmaSlider) {
            heisenbergSigmaSlider.addEventListener('input', updateHeisenberg);
        }

        // Запуск при старте
        window.addEventListener('load', () => {
            drawDelta();
            drawWave(); 
            initCollapseSim();
            updateHeisenberg();
            initTicket5Sim();
            initTicket6Sim();
            initTicket7Sim();
            initTicket8Sim();
            initTicket9Sim();
            initTicket10Sim();
            initTicket11Sim();
            initTicket12Sim();
        });

// --- --- Визуализация тока вероятности (Билет 5) --- ---
let t5SimRunning = false;
let t5Time = 0;
let t5Canvas = null;
let t5Ctx = null;

function initTicket5Sim() {
    t5Canvas = document.getElementById('currentSimCanvas');
    if (!t5Canvas) return;
    t5Ctx = t5Canvas.getContext('2d');
    
    if (!t5SimRunning) {
        t5SimRunning = true;
        requestAnimationFrame(t5SimLoop);
    }
}

function t5SimLoop() {
    if (activeTicket !== 5) {
        t5SimRunning = false;
        return;
    }
    
    t5Time += 0.05;
    if (t5Time > 15) t5Time = -15; // loop back
    
    drawTicket5Frame();
    requestAnimationFrame(t5SimLoop);
}

function drawTicket5Frame() {
    if (!t5Canvas || !t5Ctx) return;
    const ctx = t5Ctx;
    const W = t5Canvas.width;
    const H = t5Canvas.height;
    
    const pSlider = document.getElementById('momentumSlider');
    const wSlider = document.getElementById('widthSlider');
    
    const p0 = pSlider ? parseFloat(pSlider.value) : 2;
    const sigma = wSlider ? parseFloat(wSlider.value) : 1.5;
    
    ctx.clearRect(0, 0, W, H);
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H/2 + 50); ctx.lineTo(W, H/2 + 50); // main x axis
    ctx.stroke();
    
    const x0 = 0; // center
    const v0 = p0; // let m = 1
    const currentX = x0 + v0 * t5Time;
    
    const scaleX = 30;
    
    // Draw probability density
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, H/2 + 50);
    
    const jPoints = [];
    
    for (let px = 0; px <= W; px += 2) {
        const x = (px - W/2) / scaleX;
        const dist = x - currentX;
        // rho(x)
        const rho = Math.exp(-(dist * dist) / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
        
        const py = H/2 + 50 - rho * 300;
        ctx.lineTo(px, py);
        
        if (px % 40 === 0) {
            jPoints.push({x: px, px_val: x, rho: rho});
        }
    }
    ctx.lineTo(W, H/2 + 50);
    ctx.fill();
    ctx.stroke();
    
    // Draw probability current vectors
    // j = p0 * rho
    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;
    
    jPoints.forEach(pt => {
        const jVal = p0 * pt.rho;
        if (Math.abs(jVal) > 0.01) {
            drawArrow(ctx, pt.x, H/2 + 80, pt.x + jVal * 40, H/2 + 80);
        }
    });
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px sans-serif';
    ctx.fillText('ρ(x,t)', W/2 - 20, 30);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('j(x,t) = ρ(x,t) · p/m', W/2 - 50, H - 20);
}

function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = 10; 
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}

// --- --- Симуляция волнового пакета (Билет 6) --- ---
let t6SimRunning = false;
let t6Time = 0;
let t6Canvas = null;
let t6Ctx = null;
let t6IsPaused = false;

function initTicket6Sim() {
    t6Canvas = document.getElementById('packetCanvas');
    if (!t6Canvas) return;
    t6Ctx = t6Canvas.getContext('2d');
    
    const p0Slider = document.getElementById('p0Slider');
    const sigmaSlider = document.getElementById('sigmaSlider');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const resetBtn = document.getElementById('resetSimBtn');
    
    if (p0Slider) {
        p0Slider.addEventListener('input', () => {
            document.getElementById('p0Val').innerText = parseFloat(p0Slider.value).toFixed(1);
        });
    }
    
    if (sigmaSlider) {
        sigmaSlider.addEventListener('input', () => {
            document.getElementById('sigmaVal').innerText = parseFloat(sigmaSlider.value).toFixed(1);
        });
    }
    
    if (playPauseBtn) {
        playPauseBtn.onclick = () => {
            t6IsPaused = !t6IsPaused;
            playPauseBtn.innerText = t6IsPaused ? "Возобновить" : "Пауза";
        };
    }
    
    if (resetBtn) {
        resetBtn.onclick = () => {
            t6Time = 0;
        };
    }
    
    if (!t6SimRunning) {
        t6SimRunning = true;
        t6Time = 0;
        requestAnimationFrame(t6SimLoop);
    }
}

function t6SimLoop() {
    if (activeTicket !== 6) {
        t6SimRunning = false;
        return;
    }
    
    if (!t6IsPaused) {
        t6Time += 0.05;
        // loop back if it goes too far
        if (t6Time > 25) t6Time = 0;
    }
    
    drawTicket6Frame();
    requestAnimationFrame(t6SimLoop);
}

function drawTicket6Frame() {
    if (!t6Canvas || !t6Ctx) return;
    const ctx = t6Ctx;
    const W = t6Canvas.width;
    const H = t6Canvas.height;
    
    const p0Slider = document.getElementById('p0Slider');
    const sigmaSlider = document.getElementById('sigmaSlider');
    
    const p0 = p0Slider ? parseFloat(p0Slider.value) : 6;
    const sigma0 = sigmaSlider ? parseFloat(sigmaSlider.value) : 1.0;
    
    ctx.clearRect(0, 0, W, H);
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H/2 + 20); ctx.lineTo(W, H/2 + 20);
    ctx.stroke();
    
    // Parameters (m = 1, hbar = 1)
    const m = 1;
    const hbar = 1;
    const v_g = p0 / m;
    const v_ph = p0 / (2 * m);
    
    const x0 = W / 4 / 20; // initial position in model units
    const currentX = x0 + v_g * t6Time; // Center of the packet
    
    // Width spreading: sigma(t) = sigma0 * sqrt(1 + (hbar*t / (m * sigma0^2))^2)
    // Here sigma0 is related to Delta x. Let's say sigma = Delta x.
    const spreadingFactor = Math.sqrt(1 + Math.pow((hbar * t6Time) / (m * sigma0 * sigma0), 2));
    const sigma_t = sigma0 * spreadingFactor;
    
    const scaleX = 20; // pixels per unit x
    const amplitude = 120 / spreadingFactor; // Amplitude decreases as it spreads
    
    // Draw envelope |Psi|^2
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, H/2 + 20);
    
    for (let px = 0; px <= W; px++) {
        const x = px / scaleX;
        const dist = x - currentX;
        
        // Gaussian envelope for |Psi|^2
        const env = Math.exp(-(dist * dist) / (2 * sigma_t * sigma_t));
        const py = H/2 + 20 - env * amplitude;
        
        ctx.lineTo(px, py);
    }
    ctx.lineTo(W, H/2 + 20);
    ctx.fill();
    ctx.stroke();
    
    // Draw real part Re(Psi)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let px = 0; px <= W; px += 1) {
        const x = px / scaleX;
        const dist = x - currentX;
        
        // Re(Psi) = Env * cos(k0 x - omega t)
        // Note: the phase should be p0*x - E*t, but the center of phase is slightly more complex.
        // We use a simplified visual representation:
        const phase = p0 * (x - x0) - (p0 * p0 / (2*m)) * t6Time;
        const env = Math.exp(-(dist * dist) / (4 * sigma_t * sigma_t)); // Amplitude is sqrt of prob
        
        const y = env * Math.cos(phase);
        const py = H/2 + 20 - y * amplitude * 0.8;
        
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.stroke();
    
    // Legend
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(W - 180, 20, 12, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.fillText('|Ψ(x,t)|² (Огибающая)', W - 160, 27);
    
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(W - 180, 40, 12, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Re Ψ(x,t) (Фаза)', W - 160, 47);
    
    // Info text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`Время t: ${t6Time.toFixed(1)}`, 20, 30);
    ctx.fillText(`Ширина σ(t): ${sigma_t.toFixed(2)}`, 20, 50);
    ctx.fillText(`v_group = ${v_g.toFixed(1)}`, 20, 70);
}

// --- --- Визуализация рассеяния на барьере (Билет 7) --- ---
let t7SimRunning = false;
let t7Time = 0;
let t7Canvas = null;
let t7Ctx = null;

function initTicket7Sim() {
    t7Canvas = document.getElementById('barrierCanvas');
    if (!t7Canvas) return;
    t7Ctx = t7Canvas.getContext('2d');
    
    const eSlider = document.getElementById('energySlider');
    if (eSlider) {
        eSlider.addEventListener('input', () => {
            document.getElementById('energyVal').innerText = parseFloat(eSlider.value).toFixed(2);
        });
    }
    
    if (!t7SimRunning) {
        t7SimRunning = true;
        t7Time = 0;
        requestAnimationFrame(t7SimLoop);
    }
}

function t7SimLoop() {
    if (activeTicket !== 7) {
        t7SimRunning = false;
        return;
    }
    
    t7Time += 0.05;
    
    drawTicket7Frame();
    requestAnimationFrame(t7SimLoop);
}

function drawTicket7Frame() {
    if (!t7Canvas || !t7Ctx) return;
    const ctx = t7Ctx;
    const W = t7Canvas.width;
    const H = t7Canvas.height;
    
    const eSlider = document.getElementById('energySlider');
    const EV0 = eSlider ? parseFloat(eSlider.value) : 0.5; // E / V0
    const V0 = 4; // Arbitrary height
    const E = EV0 * V0;
    
    ctx.clearRect(0, 0, W, H);
    
    // Coordinates
    const centerY = H / 2 + 50;
    const a = 40; // barrier half-width
    const xLeft = W / 2 - a;
    const xRight = W / 2 + a;
    
    // Draw Potential Barrier V(x)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(xLeft, centerY - V0 * 20, 2 * a, V0 * 20);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(xLeft, centerY);
    ctx.lineTo(xLeft, centerY - V0 * 20);
    ctx.lineTo(xRight, centerY - V0 * 20);
    ctx.lineTo(xRight, centerY);
    ctx.lineTo(W, centerY);
    ctx.stroke();
    
    // Draw E level line
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, centerY - E * 20);
    ctx.lineTo(W, centerY - E * 20);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px sans-serif';
    ctx.fillText('E', 10, centerY - E * 20 - 5);
    
    // Calculate R and T
    let R = 0, T = 0;
    if (E < V0) {
        // Tunneling E < V0
        const k = Math.sqrt(E);
        const kappa = Math.sqrt(V0 - E);
        const p = Math.pow(V0, 2) * Math.pow(Math.sinh(2 * kappa * (a / 20)), 2) / (4 * E * (V0 - E));
        R = p / (1 + p);
        T = 1 / (1 + p);
    } else if (E > V0) {
        // Above barrier E > V0
        const k = Math.sqrt(E);
        const kappa = Math.sqrt(E - V0);
        const p = Math.pow(V0, 2) * Math.pow(Math.sin(2 * kappa * (a / 20)), 2) / (4 * E * (E - V0));
        R = p / (1 + p);
        T = 1 / (1 + p);
    } else {
        // E = V0
        const Q2 = V0 * Math.pow(a / 20, 2);
        R = Q2 / (1 + Q2);
        T = 1 / (1 + Q2);
    }
    
    const transVal = document.getElementById('transVal');
    const reflVal = document.getElementById('reflVal');
    if (transVal) transVal.innerText = T.toFixed(2);
    if (reflVal) reflVal.innerText = R.toFixed(2);
    
    // We will draw a qualitative wave representation
    const k1 = Math.sqrt(E) * 0.5;
    
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Region I: incident + reflected
    // Psi = A e^{ikx} + B e^{-ikx}, we'll draw real part
    // incident amplitude = 1, reflected = sqrt(R)
    for (let x = 0; x <= xLeft; x += 2) {
        const dx = (x - xLeft) / 20;
        const phaseI = k1 * dx - t7Time;
        const phaseR = -k1 * dx - t7Time;
        const val = Math.cos(phaseI) + Math.sqrt(R) * Math.cos(phaseR);
        const y = centerY - E * 20 - val * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    
    // Region II: Barrier
    if (E < V0) {
        const kappa = Math.sqrt(V0 - E) * 0.5;
        for (let x = xLeft; x <= xRight; x += 2) {
            const dx = (x - xLeft) / 20;
            const env = Math.exp(-kappa * dx);
            const val = (1 + Math.sqrt(R)) * env * Math.cos(-t7Time); 
            // Rough approximation for visual continuity
            const y = centerY - E * 20 - val * 15;
            ctx.lineTo(x, y);
        }
    } else {
        const k2 = Math.sqrt(E - V0) * 0.5;
        for (let x = xLeft; x <= xRight; x += 2) {
            const dx = (x - xLeft) / 20;
            const phase = k2 * dx - t7Time;
            // Rough approx for visual
            const val = (1 + Math.sqrt(R)) * Math.cos(phase);
            const y = centerY - E * 20 - val * 15;
            ctx.lineTo(x, y);
        }
    }
    
    // Region III: Transmitted
    for (let x = xRight; x <= W; x += 2) {
        const dx = (x - xRight) / 20;
        const phase = k1 * dx - t7Time;
        // Using T for probability -> sqrt(T) for amplitude
        const val = Math.sqrt(T) * Math.cos(phase);
        const y = centerY - E * 20 - val * 15;
        ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Область I', xLeft / 2 - 30, H - 20);
    ctx.fillText('Область II', W / 2 - 30, H - 20);
    ctx.fillText('Область III', xRight + (W - xRight)/2 - 30, H - 20);
}

// --- --- Визуализация Сферы Блоха (Билет 8) --- ---
let t8SimRunning = false;
let t8Canvas = null;
let t8Ctx = null;
let t8RotX = 0.3; // camera angle X
let t8RotY = -0.5; // camera angle Y

function initTicket8Sim() {
    t8Canvas = document.getElementById('blochCanvas');
    if (!t8Canvas) return;
    t8Ctx = t8Canvas.getContext('2d');
    
    const thetaSlider = document.getElementById('thetaSlider');
    const phiSlider = document.getElementById('phiSlider');
    
    const updateLabels = () => {
        if(thetaSlider) document.getElementById('thetaVal').innerText = parseFloat(thetaSlider.value).toFixed(2);
        if(phiSlider) document.getElementById('phiVal').innerText = parseFloat(phiSlider.value).toFixed(2);
    };
    
    if (thetaSlider) thetaSlider.addEventListener('input', updateLabels);
    if (phiSlider) phiSlider.addEventListener('input', updateLabels);
    
    // Add mouse drag to rotate the sphere
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    
    t8Canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        t8Canvas.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mouseup', () => {
        isDragging = false;
        if(t8Canvas) t8Canvas.style.cursor = 'grab';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        t8RotY += dx * 0.01;
        t8RotX += dy * 0.01;
        
        // clamp rotX
        t8RotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, t8RotX));
        
        lastX = e.clientX;
        lastY = e.clientY;
    });
    
    if (!t8SimRunning) {
        t8SimRunning = true;
        requestAnimationFrame(t8SimLoop);
    }
}

function t8SimLoop() {
    if (activeTicket !== 8) {
        t8SimRunning = false;
        return;
    }
    
    drawTicket8Frame();
    requestAnimationFrame(t8SimLoop);
}

function drawTicket8Frame() {
    if (!t8Canvas || !t8Ctx) return;
    const ctx = t8Ctx;
    const W = t8Canvas.width;
    const H = t8Canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 * 0.7; // Radius of sphere
    
    const thetaSlider = document.getElementById('thetaSlider');
    const phiSlider = document.getElementById('phiSlider');
    
    const theta = thetaSlider ? parseFloat(thetaSlider.value) : 0;
    const phi = phiSlider ? parseFloat(phiSlider.value) : 0;
    
    // Calculate probabilities
    // State: cos(theta/2) |up> + e^{i phi} sin(theta/2) |down>
    // P(+z) = cos^2(theta/2)
    // P(+x) = 1/2 (1 + sin(theta) cos(phi))
    // P(+y) = 1/2 (1 + sin(theta) sin(phi))
    
    const pZ = Math.pow(Math.cos(theta/2), 2);
    const pX = 0.5 * (1 + Math.sin(theta) * Math.cos(phi));
    const pY = 0.5 * (1 + Math.sin(theta) * Math.sin(phi));
    
    const probZ = document.getElementById('probZ');
    const probX = document.getElementById('probX');
    const probY = document.getElementById('probY');
    
    if(probZ) probZ.innerText = (pZ * 100).toFixed(1);
    if(probX) probX.innerText = (pX * 100).toFixed(1);
    if(probY) probY.innerText = (pY * 100).toFixed(1);
    
    ctx.clearRect(0, 0, W, H);
    
    // 3D projection function
    const project = (x, y, z) => {
        // Rotate around X axis
        let y1 = y * Math.cos(t8RotX) - z * Math.sin(t8RotX);
        let z1 = y * Math.sin(t8RotX) + z * Math.cos(t8RotX);
        // Rotate around Y axis
        let x2 = x * Math.cos(t8RotY) + z1 * Math.sin(t8RotY);
        let z2 = -x * Math.sin(t8RotY) + z1 * Math.cos(t8RotY);
        let y2 = y1;
        
        return {
            px: cx + x2 * R,
            py: cy - y2 * R,
            pz: z2 // depth for sorting/styling if needed
        };
    };
    
    // Draw sphere outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw equator and meridians
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    for(let i=0; i<=60; i++) {
        let a = i / 60 * Math.PI * 2;
        let pt = project(Math.cos(a), 0, Math.sin(a)); // equator
        if(i===0) ctx.moveTo(pt.px, pt.py);
        else ctx.lineTo(pt.px, pt.py);
    }
    ctx.stroke();
    
    // Draw axes
    const drawAxis = (x, y, z, color, label) => {
        const origin = project(0, 0, 0);
        const end = project(x*1.2, y*1.2, z*1.2); // extending slightly beyond sphere
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        // dashed for negative part
        const neg = project(-x*1.2, -y*1.2, -z*1.2);
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(neg.px, neg.py);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.setLineDash([]);
        ctx.moveTo(origin.px, origin.py);
        ctx.lineTo(end.px, end.py);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = '14px sans-serif';
        ctx.fillText(label, end.px + 5, end.py + 5);
    };
    
    drawAxis(1, 0, 0, '#60a5fa', 'X');
    drawAxis(0, 0, 1, '#f472b6', 'Y');
    drawAxis(0, 1, 0, '#4ade80', 'Z');
    
    // Draw State Vector
    // In physics Z is up. In our projection: x=X, y=Z, z=Y
    const physX = Math.sin(theta) * Math.cos(phi);
    const physY = Math.sin(theta) * Math.sin(phi);
    const physZ = Math.cos(theta);
    
    const statePt = project(physX, physZ, physY);
    const origin = project(0, 0, 0);
    
    ctx.strokeStyle = '#c084fc'; // Purple for state vector
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(origin.px, origin.py);
    ctx.lineTo(statePt.px, statePt.py);
    ctx.stroke();
    
    // Draw point at end of vector
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(statePt.px, statePt.py, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillText('|ψ⟩', statePt.px + 8, statePt.py - 8);
    
    // Draw projection lines to axes
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    
    // projection on Z axis
    const projZ = project(0, physZ, 0);
    ctx.moveTo(statePt.px, statePt.py);
    ctx.lineTo(projZ.px, projZ.py);
    
    // projection on XY plane
    const projXY = project(physX, 0, physY);
    ctx.moveTo(statePt.px, statePt.py);
    ctx.lineTo(projXY.px, projXY.py);
    ctx.lineTo(origin.px, origin.py);
    
    ctx.stroke();
    ctx.setLineDash([]);
}

// --- --- Визуализация Радиальных волновых функций (Билет 9) --- ---
let t9SimRunning = false;
let t9Canvas = null;
let t9Ctx = null;
let t9_n = 3;
let t9_l = 1;

function initTicket9Sim() {
    t9Canvas = document.getElementById('radialCanvas');
    if (!t9Canvas) return;
    t9Ctx = t9Canvas.getContext('2d');
    
    const nSelect = document.getElementById('nSelect');
    const lSelect = document.getElementById('lSelect');
    const nodesCount = document.getElementById('nodesCount');
    
    const updateLOptions = () => {
        if (!nSelect || !lSelect) return;
        t9_n = parseInt(nSelect.value);
        
        // Save current l
        let currentL = parseInt(lSelect.value);
        
        // Clear and rebuild options
        lSelect.innerHTML = '';
        const lLabels = ['0 (s)', '1 (p)', '2 (d)', '3 (f)'];
        for(let l=0; l<t9_n; l++) {
            const opt = document.createElement('option');
            opt.value = l;
            opt.innerText = `l = ${lLabels[l]}`;
            lSelect.appendChild(opt);
        }
        
        // Restore l if valid, otherwise set to max
        if (currentL < t9_n) {
            lSelect.value = currentL;
            t9_l = currentL;
        } else {
            lSelect.value = t9_n - 1;
            t9_l = t9_n - 1;
        }
        
        if (nodesCount) {
            nodesCount.innerText = t9_n - t9_l - 1;
        }
        drawTicket9Frame();
    };
    
    if (nSelect) nSelect.addEventListener('change', updateLOptions);
    if (lSelect) lSelect.addEventListener('change', () => {
        t9_l = parseInt(lSelect.value);
        if (nodesCount) nodesCount.innerText = t9_n - t9_l - 1;
        drawTicket9Frame();
    });
    
    // Initial setup
    updateLOptions();
    
    if (!t9SimRunning) {
        t9SimRunning = true;
        requestAnimationFrame(t9SimLoop);
    }
}

function t9SimLoop() {
    if (activeTicket !== 9) {
        t9SimRunning = false;
        return;
    }
    // Static drawing, no animation needed unless we want to pulse something.
    // Drawing is handled on change, but we keep loop alive in case of resize or tab switch.
    drawTicket9Frame();
    requestAnimationFrame(t9SimLoop);
}

function drawTicket9Frame() {
    if (!t9Canvas || !t9Ctx) return;
    const ctx = t9Ctx;
    const W = t9Canvas.width;
    const H = t9Canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    
    // Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(30, 20);
    ctx.lineTo(30, H - 30);
    ctx.lineTo(W - 20, H - 30);
    ctx.stroke();
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('P²(r)', 5, 25);
    ctx.fillText('r / a₀', W - 30, H - 10);
    
    // Helper to calculate f_nl(r)
    const f_nl = (n, l, r) => {
        if(n===1 && l===0) return 1;
        if(n===2 && l===0) return 1 - r/2;
        if(n===2 && l===1) return r;
        if(n===3 && l===0) return 1 - 2*r/3 + 2*r*r/27;
        if(n===3 && l===1) return r*(1 - r/6);
        if(n===3 && l===2) return r*r;
        if(n===4 && l===0) return 1 - 3*r/4 + r*r/8 - r*r*r/192;
        if(n===4 && l===1) return r*(1 - r/4 + r*r/80);
        if(n===4 && l===2) return r*r*(1 - r/12);
        if(n===4 && l===3) return Math.pow(r, 3);
        return 0;
    };
    
    const P2 = (r) => {
        const f = f_nl(t9_n, t9_l, r);
        const P = r * f * Math.exp(-r / t9_n);
        return P * P;
    };
    
    // Determine drawing range based on n
    const rMax = 5 + t9_n * t9_n * 2; 
    
    // Find max value to scale
    let maxVal = 0;
    const pts = 300;
    for(let i=0; i<=pts; i++) {
        let r = (i/pts) * rMax;
        let val = P2(r);
        if(val > maxVal) maxVal = val;
    }
    
    if (maxVal === 0) maxVal = 1; // avoid div by 0
    
    // Draw curve
    ctx.beginPath();
    ctx.strokeStyle = '#60a5fa'; // Blue line
    ctx.lineWidth = 2;
    
    let lastY = 0;
    for(let i=0; i<=pts; i++) {
        let r = (i/pts) * rMax;
        let val = P2(r);
        
        let x = 30 + (W - 50) * (r / rMax);
        let y = (H - 30) - (H - 60) * (val / maxVal);
        
        if (i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        // Approximate nodes visual by finding roots (P2 going to 0)
        // Since it's P^2, it touches 0 but doesn't cross.
        // We handle node counting statically, but we can draw dots.
    }
    ctx.stroke();
    
    // Draw shading under curve
    ctx.lineTo(30 + (W - 50), H - 30);
    ctx.lineTo(30, H - 30);
    ctx.fillStyle = 'rgba(96, 165, 250, 0.2)';
    ctx.fill();
    
    // Draw tick marks
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    for(let rTick=5; rTick<=rMax; rTick+=5) {
        let x = 30 + (W - 50) * (rTick / rMax);
        ctx.beginPath();
        ctx.moveTo(x, H - 30);
        ctx.lineTo(x, H - 25);
        ctx.stroke();
        ctx.fillText(rTick.toString(), x, H - 10);
    }
}

// --- --- Визуализация Моря Дирака (Билет 10) --- ---
let t10SimRunning = false;
let t10Canvas = null;
let t10Ctx = null;
let t10Particles = [];
let t10Holes = [];
let t10Positrons = [];
let t10Electrons = [];
let t10Photon = null;

function initTicket10Sim() {
    t10Canvas = document.getElementById('diracSeaCanvas');
    if (!t10Canvas) return;
    t10Ctx = t10Canvas.getContext('2d');
    
    // Initialize sea particles
    const W = t10Canvas.width;
    const H = t10Canvas.height;
    t10Particles = [];
    t10Holes = [];
    t10Positrons = [];
    t10Electrons = [];
    t10Photon = null;
    
    for(let i=0; i<60; i++) {
        t10Particles.push({
            x: Math.random() * W,
            y: H/2 + 30 + Math.random() * (H/2 - 30),
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            isHole: false
        });
    }
    
    const btnEmit = document.getElementById('btnEmitPhoton');
    const btnAnn = document.getElementById('btnAnnihilate');
    
    if (btnEmit) {
        btnEmit.onclick = () => {
            // Pick a random particle from the sea
            let available = t10Particles.filter(p => !p.isHole);
            if (available.length > 0) {
                let p = available[Math.floor(Math.random() * available.length)];
                p.isHole = true;
                t10Holes.push({x: p.x, y: p.y, targetP: p});
                t10Electrons.push({
                    x: p.x,
                    y: H/2 - 50,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2
                });
                t10Photon = {x: 0, y: p.y, targetX: p.x, targetY: p.y, active: true};
                
                btnEmit.disabled = true;
                setTimeout(() => { if (btnAnn) btnAnn.disabled = false; }, 1000);
            }
        };
    }
    
    if (btnAnn) {
        btnAnn.onclick = () => {
            if (t10Electrons.length > 0 && t10Holes.length > 0) {
                // Animate annihilation
                let e = t10Electrons.pop();
                let h = t10Holes.pop();
                h.targetP.isHole = false;
                
                btnAnn.disabled = true;
                btnEmit.disabled = false;
            }
        };
    }
    
    if (!t10SimRunning) {
        t10SimRunning = true;
        requestAnimationFrame(t10SimLoop);
    }
}

function t10SimLoop() {
    if (activeTicket !== 10) {
        t10SimRunning = false;
        return;
    }
    drawTicket10Frame();
    requestAnimationFrame(t10SimLoop);
}

function drawTicket10Frame() {
    if (!t10Canvas || !t10Ctx) return;
    const ctx = t10Ctx;
    const W = t10Canvas.width;
    const H = t10Canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    
    // Draw continuum zones
    const gap = 60;
    const mid = H/2;
    ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
    ctx.fillRect(0, 0, W, mid - gap/2);
    ctx.fillStyle = '#4ade80';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Положительный континуум (E > mc²)', 10, 20);
    ctx.beginPath();
    ctx.moveTo(0, mid - gap/2);
    ctx.lineTo(W, mid - gap/2);
    ctx.strokeStyle = '#4ade80';
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.fillRect(0, mid + gap/2, W, mid - gap/2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Отрицательный континуум (E < -mc²)', 10, mid + gap/2 + 20);
    ctx.textAlign = 'center';
    ctx.fillText('Море Дирака', W/2, H - 10);
    ctx.beginPath();
    ctx.moveTo(0, mid + gap/2);
    ctx.lineTo(W, mid + gap/2);
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();
    
    // Update and draw particles
    t10Particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < mid + gap/2 || p.y > H) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        if (p.isHole) {
            ctx.strokeStyle = '#f472b6'; // Positron hole is pink
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#38bdf8';
            ctx.fill();
        }
    });
    
    // Draw electrons in positive continuum
    t10Electrons.forEach(e => {
        e.x += e.vx;
        e.y += e.vy;
        if (e.x < 0 || e.x > W) e.vx *= -1;
        if (e.y < 0 || e.y > mid - gap/2) e.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, 4, 0, Math.PI*2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();
    });
    
    // Draw photon
    if (t10Photon && t10Photon.active) {
        t10Photon.x += 10;
        ctx.beginPath();
        ctx.moveTo(t10Photon.x - 20, t10Photon.y);
        ctx.lineTo(t10Photon.x, t10Photon.y);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
        if (t10Photon.x > t10Photon.targetX) {
            t10Photon.active = false;
        }
    }
}

// --- --- Визуализация Эффекта Зеемана (Билет 11) --- ---
let zeemanCanvas = null;
let zeemanCtx = null;

function initTicket11Sim() {
    zeemanCanvas = document.getElementById('zeemanCanvas');
    if (!zeemanCanvas) return;
    zeemanCtx = zeemanCanvas.getContext('2d');
    
    const bSlider = document.getElementById('bFieldSlider');
    const bVal = document.getElementById('bFieldVal');
    
    const drawZeeman = () => {
        if (!zeemanCanvas || !zeemanCtx) return;
        const ctx = zeemanCtx;
        const W = zeemanCanvas.width;
        const H = zeemanCanvas.height;
        ctx.clearRect(0, 0, W, H);
        
        let B = parseFloat(bSlider ? bSlider.value : 0);
        if (bVal) bVal.innerText = B.toFixed(1);
        
        const midY = H / 2;
        const startX = 50;
        const endX = W - 60;
        
        // Draw axis
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, 20); ctx.lineTo(startX, H - 20);
        ctx.stroke();
        
        // Label axis
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px sans-serif';
        ctx.fillText('E', startX - 15, 30);
        
        // Draw Energy levels
        // E = E0 + m * B * scale
        const scale = 20;
        
        ctx.lineWidth = 2;
        ctx.font = '14px sans-serif';
        
        // m = 0
        ctx.strokeStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(startX, midY);
        ctx.lineTo(endX, midY);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('m = 0', endX + 5, midY + 5);
        
        // m = +1
        let y1 = midY - B * scale;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(startX, midY);
        ctx.lineTo(startX + 80, y1);
        ctx.lineTo(endX, y1);
        ctx.stroke();
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('m = +1', endX + 5, y1 + 5);
        
        // m = -1
        let ym1 = midY + B * scale;
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(startX, midY);
        ctx.lineTo(startX + 80, ym1);
        ctx.lineTo(endX, ym1);
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillText('m = -1', endX + 5, ym1 + 5);
        
        // Splitting indication
        if (B > 0) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(startX + 150, y1);
            ctx.lineTo(startX + 150, midY);
            ctx.stroke();
            
            ctx.moveTo(startX + 250, midY);
            ctx.lineTo(startX + 250, ym1);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText('ΔE = μB·H', startX + 155, midY - (B * scale)/2 + 5);
        }
    };
    
    if (bSlider) {
        bSlider.addEventListener('input', drawZeeman);
    }
    
    drawZeeman();
}

// --- --- Симуляция двухуровневой системы: Поглощение и Излучение (Билет 12) --- ---
let t12SimRunning = false;
let t12Canvas = null;
let t12Ctx = null;
let t12Time = 0;
let t12State = 0; // 0 - lower level, 1 - upper level
let t12TransitionProgress = 0; // 0.0 to 1.0 during transition
let t12TargetState = 0;
let t12PhotonWave = null; // {x, y, dx, active, isEmission}
const T12_ENERGY_DIFF = 1.0; // Энергия перехода $\Delta E$

function initTicket12Sim() {
    t12Canvas = document.getElementById('twoLevelCanvas');
    if (!t12Canvas) return;
    t12Ctx = t12Canvas.getContext('2d');
    
    const slider = document.getElementById('photonFreq');
    const valDisplay = document.getElementById('photonFreqVal');
    const btnEmit = document.getElementById('btnEmitLight');
    const btnSpont = document.getElementById('btnSpontaneous');
    
    if (slider) {
        slider.addEventListener('input', () => {
            if (valDisplay) valDisplay.innerText = parseFloat(slider.value).toFixed(1);
        });
    }
    
    if (btnEmit) {
        btnEmit.onclick = () => {
            const hOmega = parseFloat(slider ? slider.value : 1.0);
            const isResonance = Math.abs(hOmega - T12_ENERGY_DIFF) < 0.05;
            
            // Запускаем летящий фотон
            t12PhotonWave = {
                x: 0,
                dx: 6,
                active: true,
                isEmission: false,
                isResonance: isResonance
            };
        };
    }
    
    if (btnSpont) {
        btnSpont.onclick = () => {
            if (t12State === 1 && t12TransitionProgress === 0) {
                // Спонтанный распад
                t12TargetState = 0;
                t12TransitionProgress = 0.01;
            }
        };
    }
    
    if (!t12SimRunning) {
        t12SimRunning = true;
        requestAnimationFrame(t12SimLoop);
    }
}

function t12SimLoop() {
    if (activeTicket !== 12) {
        t12SimRunning = false;
        return;
    }
    t12Time += 0.1;
    drawTicket12Frame();
    requestAnimationFrame(t12SimLoop);
}

function drawTicket12Frame() {
    if (!t12Canvas || !t12Ctx) return;
    const ctx = t12Ctx;
    const W = t12Canvas.width;
    const H = t12Canvas.height;
    
    ctx.clearRect(0, 0, W, H);
    
    const level1Y = H - 50;
    const level2Y = 60;
    const centerX = W / 2 + 50;
    
    // Draw levels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 80, level1Y);
    ctx.lineTo(centerX + 80, level1Y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px sans-serif';
    ctx.fillText('E1 (n)', centerX + 90, level1Y + 5);
    
    ctx.beginPath();
    ctx.moveTo(centerX - 80, level2Y);
    ctx.lineTo(centerX + 80, level2Y);
    ctx.stroke();
    ctx.fillText('E2 (k)', centerX + 90, level2Y + 5);
    
    // Handle photon
    if (t12PhotonWave && t12PhotonWave.active) {
        t12PhotonWave.x += t12PhotonWave.dx;
        
        ctx.strokeStyle = t12PhotonWave.isEmission ? '#f59e0b' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const startX = t12PhotonWave.x - 30;
        const endX = t12PhotonWave.x;
        const py = t12State === 0 ? level1Y : level2Y;
        
        for (let i = startX; i <= endX; i++) {
            const dy = Math.sin((i - startX) * 0.5) * 10;
            if (i === startX) ctx.moveTo(i, py + dy);
            else ctx.lineTo(i, py + dy);
        }
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(endX, py);
        ctx.lineTo(endX - 5, py - 5);
        ctx.moveTo(endX, py);
        ctx.lineTo(endX - 5, py + 5);
        ctx.stroke();
        
        // Interaction with atom
        if (!t12PhotonWave.isEmission && t12PhotonWave.x >= centerX) {
            t12PhotonWave.active = false;
            
            if (t12PhotonWave.isResonance) {
                // Если был на нижнем - поглощение
                if (t12State === 0 && t12TransitionProgress === 0) {
                    t12TargetState = 1;
                    t12TransitionProgress = 0.01;
                }
                // Если был на верхнем - индуцированное излучение
                else if (t12State === 1 && t12TransitionProgress === 0) {
                    t12TargetState = 0;
                    t12TransitionProgress = 0.01;
                    
                    // Запускаем второй когерентный фотон (индуцированное излучение)
                    setTimeout(() => {
                        if(activeTicket === 12) {
                            t12PhotonWave = { x: centerX, dx: 6, active: true, isEmission: true };
                            // и еще один, т.к. их теперь два
                            const t12PhotonWave2 = { x: centerX + 30, dx: 6, active: true, isEmission: true };
                        }
                    }, 100);
                }
            }
        }
        
        if (t12PhotonWave.x > W + 50) {
            t12PhotonWave.active = false;
        }
    }
    
    // Animate transition
    if (t12TransitionProgress > 0) {
        t12TransitionProgress += 0.05;
        if (t12TransitionProgress >= 1) {
            t12State = t12TargetState;
            t12TransitionProgress = 0;
            
            // Если спонтанный распад или индуцированное излучение - испускаем фотон
            if (t12State === 0) {
                t12PhotonWave = { x: centerX, dx: 6, active: true, isEmission: true };
            }
        }
    }
    
    // Draw electron
    const eRadius = 8;
    ctx.fillStyle = '#ef4444';
    
    let currentY = t12State === 0 ? level1Y : level2Y;
    if (t12TransitionProgress > 0) {
        const startY = t12State === 0 ? level1Y : level2Y;
        const targetY = t12TargetState === 0 ? level1Y : level2Y;
        
        // ease-in-out interpolation
        const t = t12TransitionProgress;
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        currentY = startY + (targetY - startY) * ease;
    }
    
    ctx.beginPath();
    ctx.arc(centerX, currentY, eRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Pulsing effect when excited
    if (t12State === 1 && t12TransitionProgress === 0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(centerX, currentY, eRadius + 4 + Math.sin(t12Time) * 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
