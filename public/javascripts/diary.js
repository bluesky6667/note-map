'use strict';

(function(window, factory) {
    window.Diary = factory(window.$, window.Note);
})(this, function($, Note) {
    class Diary extends Note {
        constructor(options) {
            super(options);
            const _this = this;
            if ( options ) {
                this.diaryId = options.diaryId;
            }            
            if ( this.type === 'list' ) {
                this.category = options.category; 
                this.categoryInfo = options.categoryInfo; 
                this.diaryMarker = options.diaryMarker; 
                this.diaryMgmt = options.diaryMgmt;

                this.currPage = 1;
                this.makeDiaryList();
                this.resizeFn = this.resizeDiaryList;
                
            } else {
                this.diaryList = options.diaryList;
                this.category = this.diaryList.category;
                this.categoryInfo = this.diaryList.categoryInfo; 
                this.diaryMarker = this.diaryList.diaryMarker; 
                this.diaryMgmt = this.diaryList.diaryMgmt;

                this.makeDiary();
                this.closeFn = () => {
                    this.destroy();
                    this.diaryMgmt[this.id] = null;
                    delete this.diaryMgmt[this.id];
                };
                this.resizeFn = this.resizeDiaryContents;

            }
            if ( this.type === 'list' ) {
                $('#start-date').datepicker({
                    dateFormat: "yy-mm-dd"
                }).datepicker('setDate', '-1Y');
                $('#end-date').datepicker({
                    dateFormat: "yy-mm-dd"
                }).datepicker('setDate', 'today');
                this.getDiaryList(true);
            } else {
                this.open(true);
            }
            this.diaryMgmt[this.id] = this;
            
            this.$note.resizable('option', 'resize', this.resizeFn);
            this.$note.on('click', '.remove-place', function(e) {
                if (confirm('정말 삭제하시겠습니까?')) {
                    _this.setPlace();
                }
            });
            this.$note.on('click', '.place-name', function(e) {
                _this.movePlace();
            });
        }
        makeDiaryList() {
            const _this = this;
            const $diary = this.make();
            $('<button id="add-diary" class="icon-add add-btn" title="노트 추가"></button>').appendTo($diary.find('.note-header'))
            .on('click', function(e) {
                new Diary({diaryList: _this, map: _this.map});
                $diary.css('zIndex', 1);
            });
            const $searchBox = $('<div id="diary-search-box"></div>').appendTo($diary);
            $searchBox.append('<div class="search-box-tr"><input type="search" id="diary-keyword" name="keyword" placeholder="검색"><button id="diary-search" class="icon-search"></button></div>');
            $searchBox.append(`<div class="search-box-tr"><span class="symbol icon-clock" title="기간"></span>
                                <input type="text" id="start-date" class="datepicker" name="startDate"> - 
                                <input type="text" id="end-date" class="datepicker" name="endDate"></div>`);
            $searchBox.append('<div class="search-box-tr category-box"><span class="symbol icon-folder" title="카테고리"></span>'+this.makeCategoryTags()+'</div>');
            $searchBox.append(`<div class="search-box-tr">
                <span class="symbol icon-map" title="장소"></span>
                <span class="place-name" ></span><span class="remove-place" style="display: none;"></span>
                <input type="hidden" name="place" >
                <input type="hidden" name="placeLat" >
                <input type="hidden" name="placeLng" >
                <button class="icon-search search-place" title="장소 검색"></button></div>`);
            $diary.find('#diary-search').on('click', function (e) {
                _this.getDiaryList();
            });
            $('<div id="diary-list-box"></div>').appendTo($diary);
            $diary.on('click', '.remove-diary', function(e) {
                e.stopPropagation();
                if (confirm('정말 삭제하시겠습니까?')) {
                    const $preview = $(this).closest('.diary-preview');
                    _this.deleteDiary($preview.attr('id'));
                }
            });
        }
        makeDiary() {
            const _this = this;
            const $diary = this.make();
            this.$diary = $diary;
            const timeStamp = Date.now();
            const cateNmId = `category-name-${timeStamp}`;
            const cateColId = `category-color-${timeStamp}`;
            const $diaryOptBox = $('<div class="diary-opt-box"></div>').appendTo($diary);
            const $categoryBox = $('<div class="search-box-tr category-box"><span class="symbol icon-folder" title="카테고리"></span>'+this.makeCategoryTags('auth-', true, true)+'</div>').appendTo($diaryOptBox);
            $categoryBox.append(`<span class="md-category"><input type="text" id="${cateNmId}" name="category-name" >
                                <input type="color" id="${cateColId}" name="category-color" value="${this.getDistinctColor()}"><label for="${cateColId}"></label>
                                <button id="add-category-${timeStamp}" class="icon-add add-btn" title="카테고리 추가"></button></span>`);
            $diary.find(`#${cateColId}+label`).css('background-color', $diary.find(`#${cateColId}`).val());
            $diary.find(`#add-category-${timeStamp}`).on('click', function(e) {
                if ( $(`#${cateNmId}`).val() &&
                    !(_this.category.find((curr, i) => {return curr.name === $(`#${cateNmId}`).val()})) ) {
                    _this.createCategory({name: $(`#${cateNmId}`).val(), color: $(`#${cateColId}`).val()});
                }
            });
            $diaryOptBox.append(`<div class="search-box-tr">
                <span class="symbol icon-map" title="장소"></span>
                <span class="place-name" >${this.place.place ? this.place.place : ''}</span>
                <span class="remove-place" ${this.place.place ? '' : 'style="display: none;"'}></span>
                <input type="hidden" name="place" value="${this.place.place ? this.place.place : ''}" >
                <input type="hidden" name="placeLat" value="${this.place.placeLat ? this.place.placeLat : ''}" >
                <input type="hidden" name="placeLng" value="${this.place.placeLng ? this.place.placeLng : ''}" >
                <button class="icon-search search-place" title="장소 검색"></button></div>`);
            $diary.find(`#${cateColId}`).on('change', function(e) {
                $diary.find(`#${cateColId}+label`).css('background-color', $(this).val());
            });
            $diary.on('click', '.remove-category', function(e) {
                e.stopPropagation();
                if (confirm('정말 삭제하시겠습니까?')) {
                    const $label = $(this).parent('label');
                    const id = $label.attr('for');
                    const $input = $(`#${id}`);
                    _this.deleteCategory($input.val(), [$input, $label]);
                }
            });
            
            $diary.append('<textarea class="diary-contents" style="resize: none;"/>');
            $diary.append('<div class="diary-footer"><button class="save-diary">저 장</button></div>');
            $diary.find('.save-diary').on('click', function(e) {
                _this.saveDiary($diary);
            });
            if (this.diaryId) {
                this.getDiary(this.diaryId);
                $diary.find('.diary-footer').append('<button class="delete-diary">삭 제</button>');
                $diary.find('.delete-diary').on('click', function(e) {
                    if (confirm('정말 삭제하시겠습니까?')) {
                        _this.deleteDiary();
                    }                    
                });
            }
        }
        getCategoryList() {
            if (this.type === 'list') {
                return this.category;
            }
            return this.diaryList.category;
        }
        makeCategoryTag(prefix = '', category, unchecked, removable, idx = '') {
            const timeStamp = category.id ? category.id : Date.now();
            return `<input type="checkbox" id="${prefix}cate-${timeStamp}-${idx}" class="category" name="category" value="${category.name}" ${unchecked ? '' : 'checked'}>
                    <label for="${prefix}cate-${timeStamp}-${idx}" style="background-color: ${category.color}">${category.name}${removable ? '<span class="remove-category"></span>' : ''}</label>`;
        }
        makeCategoryTags(prefix = '', unchecked, removable) {
            const categoryList = this.getCategoryList().slice();
            if (this.type === 'list') {
                categoryList.unshift({name: '카테고리 없음', color: '#808080'});
            }
            let categoryTags = '';
            for (let i =0; i < categoryList.length; i++) {
                const category = categoryList[i];
                categoryTags += this.makeCategoryTag(prefix, category, unchecked, removable, i);
            }
            return categoryTags;
        }
        randomHex() {
            let hexStr = Math.floor(Math.random() * 256).toString(16);
            // duplication check
            return hexStr.length === 1 ? '0' + hexStr : hexStr;
        }
        getRandomRgb() {
            return '#'+this.randomHex()+this.randomHex()+this.randomHex();
        }
        getDistinctColor() {
            let randomColor = '';
            while (true) {
                randomColor = this.getRandomRgb();
                if ( '#808080' !== randomColor && !(this.category.find((curr, i) => {return curr.color === randomColor})) ) {
                    break;
                }
            }
            return randomColor;
        }
        getSearchParam() {
            let param = {};
            this.$note.find('input').each(function(i, v) {
                const $input = $(v);
                const key = $input.attr('name');
                const val = $input.val();
                if ( (val && !$input.is('[type=checkbox]')) || ($input.is('[type=checkbox]:checked')) ) {
                    if ($input.is('[type=checkbox]')) {
                        if (!param[key]) {
                            param[key] = [];
                        }
                        param[key].push(val);
                    } else {
                        param[key] = val;
                    }
                }
            });
            return param;
        }
        getDiaryList(init) {
            const _this = this;
            $.get({
                url: '/diary',
                data: this.getSearchParam(),
                success: function(data) {
                    if (init) {
                        _this.open(true);
                        _this.makeDiaryPreview(data);
                        _this.close();
                    } else {
                        _this.makeDiaryPreview(data);
                    }                    
                },
                error: function(req, stat, err) {
                }
            });
        }
        getDiary(diaryId) {
            const _this = this;
            $.get({
                url: '/diary',
                data: { diaryId: diaryId },
                success: function(data) {
                    _this.setDiaryContents(data[0]);
                },
                error: function(req, stat, err) {
                }
            });
        }
        getDiaryInfo() {
            const param = this.getSearchParam();

            param['category-name'] = null;
            delete param['category-name'];
            param['category-color'] = null;
            delete param['category-color'];

            const $contents = this.$note.find('.diary-contents');
            if ($contents[0]) {
                param.contents = $contents.val();
            }
            return param;
        }
        saveDiary($diary) {
            const _this = this;
            const diary = this.getDiaryInfo();
            if (this.diaryId) {
                diary.diaryId = this.diaryId;
                $.ajax({
                    url: '/diary',
                    type: 'PUT',
                    data: diary,
                    success: function(data) {
                        _this.diaryList.getDiaryList();
                        _this.closeFn();
                        _this.getDiaryMarkerByMoveEnd(_this.map);
                    },
                    error: function(req, stat, err) {
                        alert('저장 실패');
                    }
                });
            } else {
                $.post({
                    url: '/diary',
                    data: diary,
                    success: function(data) {
                        _this.diaryList.getDiaryList();
                        _this.closeFn();
                        _this.getDiaryMarkerByMoveEnd(_this.map);
                    },
                    error: function(req, stat, err) {
                        alert('저장 실패');
                    }
                });
            }
        }
        deleteDiary(diaryId = this.diaryId) {
            const _this = this;
            $.ajax({
                url: '/diary',
                type: 'DELETE',
                data: {diaryId: diaryId},
                success: function(data) {
                    _this.removeMarkerById(diaryId);
                    _this.diaryList.$note.find('#'+diaryId).remove();
                    if (_this.diaryId) {
                        _this.closeFn();
                    }
                },
                error: function(req, stat, err) {
                    alert('삭제 실패');
                }
            });
        }
        addLegendItem(category) {
            this.categoryInfo[(category.name === '카테고리 없음' ? 'none' : category.name)] = {color: category.color, checked: true};
            const legendItem = `<div class="legend-item"><button class="icon-markers view-categories" title="카테고리 위치로 이동"></button>
                <input type="checkbox" id="cg-${category.name}" name="legend-category" value="${category.name === '카테고리 없음' ? 'none' : category.name}" checked>
                <label for="cg-${category.name}" class="legend-category" style="background-color: ${category.color};">${category.name}</label></div>`;
            if ($('.legend-box .legend-item:has(input[value=none])')[0]) {
                $('.legend-box .legend-item:has(input[value=none])').before(legendItem);
            } else {
                $(legendItem).appendTo('.legend-box');
            }
        }
        removeLegendItem(categoryName) {
            this.categoryInfo[categoryName] = null;
            delete this.categoryInfo[categoryName];
            $(`.legend-box .legend-item:has([id='cg-${categoryName}'])`).remove();
        }
        createCategory(category) {
            const _this = this;
            const $diary = this.$diary;
            $.post({
                url: '/category',
                data: category,
                success: function(data) {
                    _this.category.push(category);
                    $diary.find('.md-category').before(_this.makeCategoryTag('auth-', category, false, true));
                    $diary.find('input[name=category-name]').val('');
                    $diary.find('input[name=category-color]').val(_this.getDistinctColor());
                    $diary.find(`input[name=category-color]+label`).css('background-color', $diary.find('input[name=category-color]').val());
                    _this.addLegendItem(category);
                    for (let i in _this.diaryMgmt) {
                        const diary = _this.diaryMgmt[i];
                        diary.updateCategory('add', category);
                    }
                },
                error: function(req, stat, err) {
                }
            });
        }
        deleteCategory(categoryName, elToRemove) {
            const _this = this;
            $.ajax({
                url: '/category',
                type: 'DELETE',
                data: {name: categoryName},
                success: function(result) {
                    for (let i in elToRemove) {
                        elToRemove[i].remove();
                    }
                    _this.category.splice(_this.category.indexOf(categoryName), 1);
                    _this.removeLegendItem(categoryName);
                    for (let i in _this.diaryMgmt) {
                        _this.diaryMgmt[i].updateCategory('delete', {name: categoryName});
                    }
                },
                error: function(req, start, err) {

                }
            })
        }
        updateCategory(cmd, category) {
            if (cmd === 'add' && this.$note.find(`.category[value='${category.name}']`).length === 0) {
                if (this.type === 'list') {
                    this.$note.find('.category-box').append(this.makeCategoryTag('', category));                    
                } else {
                    this.$note.find('.md-category').before(this.makeCategoryTag('auth-', category, true, true));
                }
            } else if (cmd === 'delete') {
                this.$note.find(`.category[value='${category.name}'],.category[value='${category.name}']+label`).remove();
            }
            if (this.type === 'list') {
                this.resizeDiaryList();
            } else {
                this.resizeDiaryContents();
            }
            const tempCategory = this.category.slice();
            tempCategory.push({name: 'none', color: '#808080'});
            this.createCategoryCss(tempCategory);
        }
        createCategoryCss(categories) {
            $('style[name=css-category]').empty();
            const cssText = [];
            for (let i = 0, len = categories.length; i < len; i++ ) {
                const category = categories[i];
                cssText.push(`.${this.createCClass(category.name)} { background-color: ${category.color}; } 
                    .${this.createCBClass(category.name)} { border-color: ${category.color}; } 
                    .${this.createCBClass(category.name)}::after { border-top-color: ${category.color}; }`);
            }
            $('style[name=css-category]').text(cssText.join(' '));
        }
        makeDiaryPreview(diaries) {
            const $diaryListBox = $('#diary-list-box');
            const $diary = this.$note;
            $diaryListBox.empty();
            const _this = this;
            for (let i = 0; i < diaries.length; i++) {
                const diary = diaries[i];
                const date = new Date(diary.createdAt);
                $(`<div class="diary-preview" id=${diary._id}>
                    <span class="preview-menu">
                        <button class="icon-remove remove-diary"></button>
                    </span>
                    <span class="preview-header">${date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.toTimeString().slice(0, 8)} ${(diary.category.length !== 0 ? '#'+diary.category.join(' #'): '')}</span>
                    <br>
                    <span class="preview-contents">${diary.contents.replace(/\n/gim,'<br>').replace(/\s/gim,'&nbsp').slice(0, 100)}</span>
                    </span>
                    </div>`).appendTo($diaryListBox)
                .on('click', function(e) {
                    // e.stopPropagation();
                    if ($(e.target).is('.remove-diary')) {
                        return;
                    }
                    new Diary({diaryId: $(this).attr('id'), diaryList: _this, map: _this.map});
                    $diary.css('zIndex', 1);
                });
            }
        }
        setDiaryContents(contents) {
            for (let i = 0; i < contents.category.length; i++) {
                this.$diary.find(`input[name=category][value='${contents.category[i]}']`).prop('checked', true);
            }
            this.setPlace({
                place: contents.place,
                placeLat: contents.placeLat,
                placeLng: contents.placeLng
            });
            this.$diary.find('.diary-contents').val(contents.contents);
        }
        resizeDiaryContents(e) {
            const $thisD = e ? $(this) : this.$diary;
            const totalH = $thisD.height();
            const headerH = $thisD.find('.note-header').outerHeight(true);
            const optH = $thisD.find('.diary-opt-box').outerHeight(true);
            const footerH = $thisD.find('.diary-footer').outerHeight(true);
            $thisD.find('.diary-contents').css('height', (totalH - headerH - optH - footerH -10)+'px');
        }
        resizeDiaryList(e) {
            const $thisD = e ? $(this) : this.$note;
            const totalH = $thisD.height();
            const headerH = $thisD.find('.note-header').outerHeight(true);
            const optH = $thisD.find('#diary-search-box').outerHeight(true);
            $thisD.find('#diary-list-box').css('height', (totalH - headerH - optH)+'px');
        }
        setPlace(place = {place: '', placeLat: '', placeLng: ''}) {
            this.place = place;
            this.$note.find('.place-name').text(place.place);
            this.$note.find('input[name=place]').val(place.place);
            this.$note.find('input[name=placeLat]').val(place.placeLat);
            this.$note.find('input[name=placeLng]').val(place.placeLng);
            if (place.place) {
                this.$note.find('.remove-place').show();
            } else {
                this.$note.find('.remove-place').hide();
            }
        }
        movePlace() {
            this.map.setCenter(new kakao.maps.LatLng(this.$note.find('input[name=placeLat]').val(), this.$note.find('input[name=placeLng]').val()));
            kakao.maps.event.trigger(this.map, 'dragend');
        }
        makeDiaryMarker(map, diaries) {
            this.clearMarker();
            for (let i = 0; i < diaries.length; i++) {
                const diary = diaries[i];
                this.makeMarkerByDiary(map, diary);
            }
        }
        // makeMarkerByDiary(map, diary) {
        //     if (diary.place) {
        //         const category = diary.category;
        //         let categoryChk = false;
        //         const marker = new kakao.maps.Marker({
        //             map: map,
        //             position: new kakao.maps.LatLng(diary.placeLat, diary.placeLng) 
        //         });
        //         marker.data = diary;
        //         const infoWindow = new kakao.maps.InfoWindow({zIndex:1});
        //         if (category.length === 0) {
        //             diaryMarker.none[diary._id] = {marker: marker, info: infoWindow};
        //             infoWindow.setContent(`<div class="diary-marker-info"><span class="diary-info-category" style="background-color: #808080;">카테고리 없음</span><button class="icon-edit-diary edit-diary" data-diary-id="${diary._id}"></button></div>`);
        //             categoryChk = categoryInfo.none.checked;
        //         } else {
        //             const infoContents = ['<div class="diary-marker-info">'];
        //             for (let j = 0; j < category.length; j++) {
        //                 if (!diaryMarker[category[j]]) {
        //                     diaryMarker[category[j]] = {};
        //                 }
        //                 diaryMarker[category[j]][diary._id] = {marker: marker, info: infoWindow};
        //                 infoContents.push(`<span class="diary-info-category" style="background-color: ${categoryInfo[category].color}">${category}</span>`);
        //                 if ( categoryInfo[category[j]].checked ) {
        //                     categoryChk = true;
        //                 }
        //             }
        //             infoContents.push(`<button class="icon-edit-diary edit-diary" data-diary-id="${diary._id}"></button></div>`);
        //             infoWindow.setContent(infoContents.join(''));
        //         }
        //         if (!categoryChk) {
        //             marker.setMap(null);
        //         } else {
        //             infoWindow.open(map, marker);
        //         }
        //         kakao.maps.event.addListener(marker, 'click', function() {
        //             if (infoWindow.getMap()) {
        //                 infoWindow.close();
        //             } else {
        //                 infoWindow.open(map, marker);
        //             }
        //         });
        //     }        
        // }
        makeMarkerByDiary(map, diary) {
            if (diary.place) {
                const _this = this;
                const category = diary.category;
                let categoryChk = false;
                const marker = this.createDiaryMarker(diary);
                marker.data = diary;
                const infoWindow = new kakao.maps.InfoWindow({zIndex:1});
                if (category.length === 0) {
                    this.diaryMarker.none[diary._id] = {marker: marker, info: infoWindow};
                    infoWindow.setContent(`<div class="diary-marker-info"><span class="diary-info-category" style="background-color: #808080;">카테고리 없음</span><button class="icon-edit-diary edit-diary" data-diary-id="${diary._id}"></button></div>`);
                    categoryChk = this.categoryInfo.none.checked;
                } else {
                    const infoContents = ['<div class="diary-marker-info">'];
                    for (let j = 0; j < category.length; j++) {
                        if (!this.diaryMarker[category[j]]) {
                            this.diaryMarker[category[j]] = {};
                        }
                        this.diaryMarker[category[j]][diary._id] = {marker: marker, info: infoWindow};
                        infoContents.push(`<span class="diary-info-category" style="background-color: ${this.categoryInfo[category].color}">${category}</span>`);
                        if ( this.categoryInfo[category[j]].checked ) {
                            categoryChk = true;
                        }
                    }
                    infoContents.push(`<button class="icon-edit-diary edit-diary" data-diary-id="${diary._id}"></button></div>`);
                    infoWindow.setContent(infoContents.join(''));
                }
                if (!categoryChk) {
                    marker.setMap(null);
                } else {
                    marker.setMap(map);
                }
                $('#map-container').off('click', `.marker-diary[data-diary-id=${diary._id}]`);
                $('#map-container').on('click', `.marker-diary[data-diary-id=${diary._id}]`, function(e) {
                    new Diary({diaryId: this.dataset.diaryId, diaryList: _this, map: _this.map});
                });
            }        
        }
        createDiaryMarker(diary) {
            let categoryClass = [];
            const category = diary.category;
            if ( category.length === 0 ) {
                categoryClass.push(this.createCBClass('none'));
            } else {
                for (let i = 0, len = category.length; i < len; i++) {
                    const cate = category[i];
                    categoryClass.push(this.createCBClass(cate));
                }
            }
            return new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(diary.placeLat, diary.placeLng),
                content: `<div class="marker-diary ${categoryClass.join(' ')}" data-diary-id="${diary._id}"></div>`,
                yAnchor: 1.4
            });
        }
        createCClass(category) {
            return `color-cate-${escape(category).replace(/\s/gm, '').replace(/%u/gm, '')}`;
        }
        createCBClass(category) {
            return `color-cate-border-${escape(category).replace(/\s/gm, '').replace(/%u/gm, '')}`;
        }
        removeMarkerById(diaryId) {
            for (let cg in this.diaryMarker) {
                const diaries = this.diaryMarker[cg];
                if ( diaries[diaryId] ) {
                    this.closeMarker(diaries[diaryId].marker, diaries[diaryId].info);
                    diaries[diaryId] = null;
                    delete diaries[diaryId];
                }
            }
        }
        clearMarker() {
            if ( this.diaryMarker ) {
                for (let cg in this.diaryMarker) {
                    const diaries = this.diaryMarker[cg];
                    for (let diaryId in diaries) {
                        this.removeMarkerById(diaryId);
                    }
                    this.diaryMarker[cg] = {};
                }
            }
        }
        openMarker(map, marker, info) {
            marker.setMap(map);
            // info.open(map, marker);
        }
        closeMarker(marker, info) {
            marker.setMap(null);
            info.close();
        }
        getDiaryMarkerByMoveEnd(map) {
            const _this = this;
            $.get({
                url: '/diary/marker',
                data: {
                    bounds: _this.getCurrBounds(map)
                },
                success: function(data) {
                    _this.makeDiaryMarker(map, data.diary);
                },
                error: function(req, stat, err) {
                }
            });
        }
        getCurrBounds(map) {
            const bounds = map.getBounds();
            const neBounds = bounds.getNorthEast();
            const swBounds = bounds.getSouthWest();
            return {
                neLat: neBounds.getLat(),
                neLng: neBounds.getLng(),
                swLat: swBounds.getLat(),
                swLng: swBounds.getLng()
            };
        }
    }
    return Diary;
});