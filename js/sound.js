// Система звуков для игры

const Sound = {
    enabled: true,
    ctx: null,
    
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
        }
        this.enabled = window.Storage ? window.Storage.getSettings().sound : true;
    },
    
    play(type) {
        if (!this.enabled || !this.ctx) return;
        
        // Resume context if suspended (required for user interaction)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        
        const now = this.ctx.currentTime;
        
        if (type === 'select') {
            this.playTone(440, 0.1, 'sine', 0.3);
        } else if (type === 'match') {
            this.playTone(523, 0.15, 'sine', 0.4);
            setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 100);
        } else if (type === 'special') {
            this.playTone(392, 0.2, 'square', 0.3);
            setTimeout(() => this.playTone(523, 0.2, 'square', 0.3), 150);
            setTimeout(() => this.playTone(784, 0.3, 'square', 0.4), 300);
        } else if (type === 'win') {
            this.playTone(523, 0.15, 'sine', 0.5);
            setTimeout(() => this.playTone(659, 0.15, 'sine', 0.5), 100);
            setTimeout(() => this.playTone(784, 0.15, 'sine', 0.5), 200);
            setTimeout(() => this.playTone(1047, 0.4, 'sine', 0.6), 300);
        } else if (type === 'lose') {
            this.playTone(392, 0.3, 'sine', 0.4);
            setTimeout(() => this.playTone(330, 0.4, 'sine', 0.3), 200);
        } else if (type === 'swap') {
            this.playTone(330, 0.08, 'triangle', 0.3);
        } else if (type === 'shuffle') {
            this.playTone(440, 0.15, 'sine', 0.3);
            setTimeout(() => this.playTone(494, 0.15, 'sine', 0.3), 100);
            setTimeout(() => this.playTone(523, 0.2, 'sine', 0.3), 200);
        }
    },
    
    playTone(freq, duration, type, volume) {
        if (!this.ctx) return;
        
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.log('Sound error:', e);
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        if (window.Storage) {
            window.Storage.setSetting('sound', this.enabled);
        }
        // Update UI
        if (window.UI) {
            window.UI.updateSettingButtons('sound', this.enabled ? 'on' : 'off');
        }
        return this.enabled;
    },
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
};

// Export
window.Sound = Sound;