/* video_playlist.js
   Dual-layer crossfading background playlist for auth page.
   Usage: set window.AUTH_VIDEO_PLAYLIST = [...urls...] and window.AUTH_VIDEO_OPTIONS = { random, fadeMs, opacity }
*/
(function(){
    const containerId = 'video-background';

    function ensureContainer(){
        const c = document.getElementById(containerId);
        if(!c) return null;
        // add overlay for consistent contrast
        if(!c.querySelector('.bg-overlay')){
            const ov = document.createElement('div'); ov.className = 'bg-overlay';
            c.appendChild(ov);
        }
        return c;
    }

    function createVideoEl(){
        const v = document.createElement('video');
        v.autoplay = true;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        v.loop = false;
        v.setAttribute('aria-hidden','true');
        return v;
    }

    function shuffle(array){
        for(let i = array.length -1; i>0; i--){
            const j = Math.floor(Math.random() * (i+1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function Playlist(playlist, opts){
        this.playlist = Array.isArray(playlist) ? playlist.slice() : [];
        this.opts = Object.assign({ random:false, fadeMs:900, opacity:0.12 }, opts || {});
        this.container = ensureContainer();
        this.currentIndex = 0;
        this.order = this.playlist.map((_,i)=>i);
        if(this.opts.random) shuffle(this.order);

        // create two video layers
        this.videoA = createVideoEl();
        this.videoB = createVideoEl();
        this.videoA.className = 'bg-video a';
        this.videoB.className = 'bg-video b';
        this.container.insertBefore(this.videoA, this.container.firstChild);
        this.container.insertBefore(this.videoB, this.container.firstChild);
        this.front = this.videoA; this.back = this.videoB;

        // bind events
        this.front.addEventListener('ended', ()=> this._onEnded());
        this.back.addEventListener('ended', ()=> this._onEnded());
    }

    Playlist.prototype._onEnded = function(){
        // ensure we advance only when a clip naturally ends on the front
        if(this.front && this.front.ended){
            this.next();
        }
    };

    Playlist.prototype._setSource = function(videoEl, url){
        if(!videoEl) return;
        try{
            // assign src and load
            if(videoEl.src !== url){
                videoEl.src = url;
                videoEl.load();
            }
        }catch(e){ console.warn('setSource error', e); }
    };

    Playlist.prototype.start = function(){
        if(!this.container) return;
        if(this.playlist.length === 0) return;
        // ensure initial index
        this.currentIndex = 0;
        const idx = this.order[this.currentIndex];
        this._setSource(this.front, this.playlist[idx]);
        // front visible
        this.front.classList.add('active');
        this.front.style.transition = `opacity ${this.opts.fadeMs}ms ease-in-out`;
        this.back.style.transition = `opacity ${this.opts.fadeMs}ms ease-in-out`;
        this.front.style.opacity = this.opts.opacity;
        // preload next into back
        const nextIdx = this._nextIndex(1);
        this._setSource(this.back, this.playlist[this.order[nextIdx]]);
        // try to play front (some browsers require a user gesture; muted autoplay usually works)
        const p = this.front.play();
        if(p && p.catch) p.catch(()=>{});
    };

    Playlist.prototype._nextIndex = function(offset){
        if(this.order.length === 0) return 0;
        return (this.currentIndex + offset) % this.order.length;
    };

    Playlist.prototype.next = function(){
        if(this.playlist.length <= 1){
            // just replay same
            this.front.currentTime = 0; this.front.play(); return;
        }
        // advance currentIndex
        this.currentIndex = this._nextIndex(1);
        // swap roles: back becomes front (visible)
        const incomingIdx = this.order[this.currentIndex];
        // ensure back has the next clip loaded (should be), then crossfade
        const incoming = this.back; const outgoing = this.front;

        // make incoming play from start
        incoming.currentTime = 0;
        const p = incoming.play(); if(p && p.catch) p.catch(()=>{});

        // perform crossfade
        incoming.classList.add('active'); incoming.style.opacity = this.opts.opacity;
        outgoing.classList.remove('active'); outgoing.style.opacity = 0;

        // after fade, swap references and preload next
        setTimeout(()=>{
            // swap
            const oldFront = this.front;
            this.front = this.back;
            this.back = oldFront;
            // preload next into back (calculate next index)
            const nextIdx = this._nextIndex(1);
            this._setSource(this.back, this.playlist[this.order[nextIdx]]);
        }, this.opts.fadeMs + 50);
    };

    Playlist.prototype.shuffleOrder = function(){
        this.order = this.playlist.map((_,i)=>i);
        shuffle(this.order);
    };

    // initialize on DOM ready
    function initFromWindow(){
        const playlist = window.AUTH_VIDEO_PLAYLIST || [];
        const opts = window.AUTH_VIDEO_OPTIONS || {};
        if(!playlist || !playlist.length) return;
        const pl = new Playlist(playlist, opts);
        pl.start();
        // when whole list consumed, if random is true reshuffle; sequential will just loop via order wrap
        // we don't need extra logic because next() uses modulo arithmetic; for random mode, to reshuffle each full cycle we could track.
        if(opts.random){
            // if random, reshuffle when we've looped through all entries once
            let played = 0;
            const max = pl.order.length;
            // intercept next to count
            const origNext = pl.next.bind(pl);
            pl.next = function(){ origNext(); played++; if(played >= max){ played = 0; pl.shuffleOrder(); } };
        }
        // expose instance for debugging
        window.__AuthVideoPlaylist = pl;
    }

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initFromWindow);
    else initFromWindow();

})();
