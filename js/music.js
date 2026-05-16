// Система фоновой музыки для игры

const Music = {
    enabled: true,
    audio: null,
    loop: true,
    volume: 0.005,
    
    init() {
        this.audio = new Audio('media/background.mp3');
        this.audio.loop = this.loop;
        
        // Load settings - music is off by default, volume 1%
        const settings = window.Storage ? window.Storage.getSettings() : { music: true };
        this.enabled = settings.music !== false;
        this.volume = 0.01; // Very low default volume
        this.audio.volume = this.volume;
    },
    
    play() {
        if (!this.enabled || !this.audio) return;
        
        // Try to play, handle autoplay restrictions
        this.audio.play().catch(err => {
            console.log('Music autoplay blocked, will play on first user interaction');
        });
    },
    
    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    },
    
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
        if (window.Storage) {
            window.Storage.setSetting('music', this.enabled);
        }
        
        if (this.enabled) {
            this.play();
        } else {
            this.pause();
        }
        
        // Update UI
        if (window.UI) {
            window.UI.updateSettingButtons('music', this.enabled ? 'on' : 'off');
        }
        
        return this.enabled;
    },
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (enabled) {
            this.play();
        } else {
            this.pause();
        }
    },
    
    setVolume(vol) {
        this.volume = vol;
        if (this.audio) {
            this.audio.volume = vol;
        }
        if (window.Storage) {
            window.Storage.setSetting('musicVolume', vol);
        }
    }
};

// Export
window.Music = Music;