        let activeTicket = 1;

        function showTicket(num) {
            activeTicket = num;
            document.querySelectorAll('.ticket-section').forEach(sec => sec.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            
            const targetSec = document.getElementById('ticket-' + num);
            if (targetSec) targetSec.classList.add('active');
            
            const targetBtn = document.querySelectorAll('.nav-btn')[num-1];
            if (targetBtn) targetBtn.classList.add('active');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (window.renderMathInElement) {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError : false
                });
            }

            // Перерисовываем канвасы при активации вкладок
            if (num === 1) drawDelta();
            if (num === 2) drawWave();
            if (num === 3) initCollapseSim();
            if (num === 4) updateHeisenberg();
            if (num === 5) initTicket5Sim();
            if (num === 6) initTicket6Sim();
            if (num === 7) initTicket7Sim();
            if (num === 8) initTicket8Sim();
            if (num === 9) initTicket9Sim();
            if (num === 10) initTicket10Sim();
            if (num === 11) initTicket11Sim();
            if (num === 12) initTicket12Sim();
        }
