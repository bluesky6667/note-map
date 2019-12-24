'use strict';

(function(window, factory) {
    window.Note = factory(window.$);
})(this, function($) {
    class Note {
        constructor({id = 'note-'+new Date().getTime(), className = '', type = 'note', place = {}, map = null}={}) {
            this.id = id;
            this.className = className;
            this.type = type;
            this.place = place;
            this.closeFn = this.close;
            this.resizeFn = this.resize;
            this.map = map;
        }
        make() {
            let _this = this;
            this.$note = 
            $(`<div id="${this.id}" class="note ${this.className}"><div class="note-header"><button class="close-btn"></button></div></div>`)
            .draggable({
                containment: 'body'
            }).resizable({
                containment: 'body',
                minWidth: 250,
                maxWidth: 600,
                minHeight: 300,
                maxHeight: 750,
                resize: this.resizeFn
            }).css('position', 'absolute');
            this.$note.on('mousedown', function(e) {
                $('.note').css('zIndex', 1)
                _this.$note.css('zIndex', 2);
            });
            this.$note.find('.close-btn').on('click', function(e) {
                _this.closeFn();
            });
            
            return this.$note;
        }
        open(init) {
            this.$note.appendTo('body');
            const $body = $('body');
            if (init) {
                this.$note.css({
                    top: ($body.height() - this.$note.outerHeight())/2 + 'px',
                    left: ($body.width() - this.$note.outerWidth())/2 + 'px'
                });
            } else {
                // 화면 밖에 있을 때
            }
            this.resizeFn();
            this.$note.css('zIndex', 2);
            return this;
        }
        close() {
            this.$note.detach();
            return this;
        }
        destroy() {
            this.$note.remove();
            return this;
        }
        resize() {
        }
        autoResize() {
        }
    }
    return Note;
});