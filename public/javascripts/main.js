'use strict';

(function(window, factory) {
    factory(window.$, window.Diary, window.Schedule);
})(this, function($, Diary, Schedule) {
    $(function() {
        $('.temp-box').hide();
        $('.cancel-search').css('opacity', 1);
        
        const container = $('#map-container')[0]; //지도를 담을 영역의 DOM 레퍼런스
        const options = { //지도를 생성할 때 필요한 기본 옵션
            center: new kakao.maps.LatLng(37.40164435210446, 127.10813031699776), //지도의 중심좌표.
            level: 12 //지도의 레벨(확대, 축소 정도)
        };
        const hidingOpacity = 0;
        const map = new kakao.maps.Map(container, options);
        const infowindow = new kakao.maps.InfoWindow({zIndex:1});
        const ps = new kakao.maps.services.Places();
        let checkSetLocPressed = null;
        let pressedTime = 0;
        
        let category = [];              // category info array
        let categoryInfo = {};          // category info obj
        let diaryMarker = {none: {}};   // for mgmt diaryMarker
        let diaryMgmt = {};             // for mgmt diary note obj
        let schedMarker = {};           // for mgmt schedMarker
        let diaryList = null;           // diaryList note obj
        let scheduleSheet = null;       // calendar note obj
        let searchedMarkers = {};       // for mgmt searched Marker

        login();
        setMapEvtListener();
        setEvtListener();

        function setMapEvtListener() {
            kakao.maps.event.addListener(map, 'click', function(e) {
                $('.menu-box input').blur();
            });
            
            kakao.maps.event.addListener(map, 'zoom_start', function(e) {
                $('.menu-box input').blur();
                //$('.note').hide();
                $('.note').css('opacity', hidingOpacity);
            });
            
            kakao.maps.event.addListener(map, 'dragstart', function(e) {
                $('.menu-box input').blur();
                //$('.note').hide();
                $('.note').css('opacity', hidingOpacity);
            });

            kakao.maps.event.addListener(map, 'zoom_changed', function(e) {
                $('.menu-box input').blur();
                //$('.note').show();
                if ($('.temp-box:has(.cancel-search)').is(':hidden')) {
                    $('.note').css('opacity', 1);
                }
                diaryList.getDiaryMarkerByMoveEnd(map);
                scheduleSheet.getSchedMarkerByMoveEnd(map);
            });
            
            kakao.maps.event.addListener(map, 'dragend', function(e) {
                $('.menu-box input').blur();
                //$('.note').show();
                if ($('.temp-box:has(.cancel-search)').is(':hidden')) {
                    $('.note').css('opacity', 1);
                }
                diaryList.getDiaryMarkerByMoveEnd(map);
                scheduleSheet.getSchedMarkerByMoveEnd(map);
            });
        }
    
        function setEvtListener() {
            $('#login').on('click', function(e) {
                if ( $('#user-id').hasClass('disabled-input') ) {
                    $('#user-id').removeAttr('readonly');
                    $('#user-id').removeClass('disabled-input');
                } else {
                    $('#user-id').attr('readonly', true);
                    $('#user-id').addClass('disabled-input');
                    createUser();
                }
            });    
            $('#user-id').on('blur', function(e) {
                if ( this.value.length === 0 ) {
                    this.value='customer';
                }
            }).on('keyup', function(e) {
                if ( e.keyCode === 13) {
                    $('#login').trigger('click');
                } else {
                    // check duplication
                }
            });
            $('#diary').on('click', function(e) {
                endSearchMode();
                diaryList.open();
            });
            $('#calendar').on('click', function(e) {
                endSearchMode();
                scheduleSheet.open();
            });
            $('#set-location').on('mousedown', function(e) {
                checkSetLocPressed = setInterval(() => {
                    pressedTime += 500;
                    if (pressedTime >= 1000) {
                        clearCheckPressed();
                        if (confirm('현재 화면을 첫 화면으로 저장하시겠습니까?')) {
                            saveScreenBounds();
                        }
                    }
                }, 500);
            });
            $('body').on('mouseup', function(e) {
                clearCheckPressed();
            });
            $('#set-location').on('mouseup', function(e) {
                clearCheckPressed();
                if ($('.home-bounds[name=neLat]').val()) {
                    setHomeBounds();
                } else {
                    if (confirm('첫 화면이 설정되어 있지 않습니다. 현재 화면으로 설정하시겠습니까?')) {
                        saveScreenBounds();
                    }
                }
            });
            $('#keyword').on('keyup', function(e) {
                if ( e.keyCode === 13 && $('#keyword').val().length > 0 ) {
                    removeSearchedMarker();
                    startSearchMode();
                    ps.keywordSearch($('#keyword').val(), placesSearchCB);
                }
            });
            $('#search').on('click', function(e) {
                if ( $('#keyword').val().length > 0 ) {
                    removeSearchedMarker();
                    startSearchMode();
                    ps.keywordSearch($('#keyword').val(), placesSearchCB);
                }
            });
            $('body').on('click', '.search-place', function(e) {
                startSearchMode();
                $('#keyword').focus();
                const $note = $(this).closest('.note');
                if ($note.hasClass('calendar')) {
                    $('.cancel-search').val($note.find('input[name=schedId]').val());
                } else {
                    $('.cancel-search').val($(this).closest('.note').attr('id'));
                }                
            });
            $('.cancel-search').on('click', function(e) {
                endSearchMode();
            });
            $('#map-container').on ('click', '.searched-marker-info .edit-diary', function(e) {
                const placeData = searchedMarkers[this.dataset.placeId].data;
                const placeInfo = {
                    place: placeData.place_name,
                    placeLat: placeData.y,
                    placeLng: placeData.x
                };
                if ($('.cancel-search').val() && diaryMgmt[$('.cancel-search').val()]) {
                    const diary = diaryMgmt[$('.cancel-search').val()];
                    diary.setPlace(placeInfo);
                } else {
                    new Diary({place: placeInfo, diaryList: diaryList, map: map});
                }
                endSearchMode();
            });
            $('#map-container').on ('click', '.searched-marker-info .edit-calendar', function(e) {
                const placeData = searchedMarkers[this.dataset.placeId].data;
                const placeInfo = {
                    place: placeData.place_name,
                    placeLat: placeData.y,
                    placeLng: placeData.x
                };
                if (scheduleSheet.$note.find('.sched-detail-info')[0]) {
                    scheduleSheet.setPlace(placeInfo);
                } else {
                    scheduleSheet.shortCutWriteSched(placeInfo);
                    scheduleSheet.open();
                }
                endSearchMode();
            });
            // $('#map-container').on ('click', '.diary-marker-info .edit-diary', function(e) {
            //     new Diary({diaryId: this.dataset.diaryId, diaryList: diaryList, map: map});
            // });
            // $('#map-container').on ('click', '.diary-marker-info .edit-calendar', function(e) {
            //     scheduleSheet.openSched(this.dataset.schedId);
            // });
            $('.legend-box').on('change', 'input[name=legend-category]', function(e) {
                const diaryMarkers = diaryMarker[this.value];
                categoryInfo[this.value].checked = this.checked;
                if (this.checked) {
                    for (let name in diaryMarkers) {
                        diaryList.openMarker(map, diaryMarkers[name].marker, diaryMarkers[name].info);
                    }
                } else {
                    for (let name in diaryMarkers) {
                        diaryList.closeMarker(diaryMarkers[name].marker, diaryMarkers[name].info);
                    }
                }
            });
            $('.legend-box').on('click', '.view-categories', function(e) {
                const category = $(this).next('input[name=legend-category]').val();
                $.get({
                    url: '/diary',
                    data: {
                        category: [ category ]
                    },
                    success: function(data) {
                        console.log(data);
                        const diaries = data.filter(function(v) {
                            return v.place;
                        });
                        if ( diaries.length > 0 ) {
                            const bounds = new kakao.maps.LatLngBounds();
                            for (let i = 0, len = diaries.length; i < len; i++) {
                                const diary = diaries[i];
                                bounds.extend(new kakao.maps.LatLng(diary.placeLat, diary.placeLng));
                            }
                            map.setBounds(bounds);
                            kakao.maps.event.trigger(map, 'dragend');
                        } else {
                            alert('해당 카테고리에 위치가 설정된 노트가 없습니다.');
                        }
                    },
                    error: function(req, stat, err) {
                    }
                });
            });
        }
        function init(data) {
            category = [];
            categoryInfo = {};
            if (diaryList) {
                diaryList.clearMarker();
                scheduleSheet.clearMarker();
            }
            diaryList = null;
            scheduleSheet = null;
            if ( diaryMgmt ) {
                for (let id in diaryMgmt) {
                    diaryMgmt[id].destroy();
                    diaryMgmt[id] = null;
                    delete diaryMgmt[id];
                }
            }
            diaryMarker = {none: {}};
            schedMarker = {};
            searchedMarkers = {};
            endSearchMode();
            $('.home-bounds').each(function(i, v) {
                $(v).val('');
            });
            setInitData(data);
        }
        function login() {
            $.post({
                url: '/users/login',
                data: {
                    id: $('#user-id').val(),
                    bounds: getCurrBounds(map)
                },
                success: function(data) {
                    init(data);
                },
                error: function(req, stat, err) {
                }
            });
        } 
        function createUser() {
            $.post({
                url: '/users',
                data: {
                    id: $('#user-id').val(),
                    bounds: getCurrBounds(map)
                },
                success: function(data) {
                    init(data);
                },
                error: function(req, stat, err) {
                }
            });
        }
        function startSearchMode() {
            $('.note').css({
                opacity: hidingOpacity,
                'pointer-events': 'none'
            });
            $('.menu-box.temp-box').show();
        }
        function endSearchMode() {
            removeSearchedMarker();
            $('.note').css({
                opacity: 1,
                'pointer-events': 'auto'
            });
            $('.menu-box.temp-box').hide();
            $('.cancel-search').val('');
        }
        function placesSearchCB (data, status, pagination) {
            if (status === kakao.maps.services.Status.OK) {
                const bounds = new kakao.maps.LatLngBounds();
                for (let i = 0; i < data.length; i++) {
                    displayMarker(data[i]);    
                    bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
                }
                map.setBounds(bounds);
            } 
        }
        function displayMarker(place) {
            const marker = new kakao.maps.Marker({
                map: map,
                position: new kakao.maps.LatLng(place.y, place.x) 
            });
            marker.data = place;
            kakao.maps.event.addListener(marker, 'click', function() {
                if ( !infowindow.getMap() || 
                    infowindow.getContent() && $(infowindow.getContent())[0].dataset.placeId != marker.data.id ) {
                    infowindow.setContent(`<div class="searched-marker-info" data-place-id="${place.id}">${place.place_name}
                        <button class="icon-edit-diary edit-diary" data-place-id="${place.id}"></button>
                        <button class="icon-edit-calendar edit-calendar" data-place-id="${place.id}"></button>
                    </div>`);
                    infowindow.open(map, marker);
                } else {
                    infowindow.close();
                }
            });
            searchedMarkers[place.id] = marker;
        }
        function removeSearchedMarker() {
            infowindow.close();
            for (let id in searchedMarkers) {
                searchedMarkers[id].setMap(null);
                searchedMarkers[id] = null;
                delete searchedMarkers[id];
            }
        }
        function setInitData(data) {
            category = data.category;
            categoryInfo = {};
            diaryMarker = {none: {}};   
            schedMarker = {};    
            diaryList = new Diary({
                type: 'list', 
                category: category, 
                categoryInfo: categoryInfo, 
                diaryMarker: diaryMarker, 
                diaryMgmt: diaryMgmt,
                map: map
            });
            scheduleSheet =  new Schedule({type: 'calendar', schedMarker: schedMarker, map: map});
            removeSearchedMarker();
            diaryList.clearMarker();     
            $('.legend-box').empty();
            const tempCategory = category.slice();
            tempCategory.push({name: '카테고리 없음', color: '#808080'});
            for (let i = 0; i < tempCategory.length; i++) {
                const cg = tempCategory[i];
                let cgName = cg.name;
                if (cgName === '카테고리 없음') {
                    cgName = 'none';
                }
                diaryMarker[cgName] = {};
                diaryList.addLegendItem(cg);
            }
            createCategoryCss(tempCategory);
            if ( data.homeBounds.neLat ) {
                const bnds = data.homeBounds;
                for (let key in bnds) {
                    $(`.home-bounds[name=${key}]`).val(bnds[key]);
                }
                setHomeBounds();
            } else {
                diaryList.makeDiaryMarker(map, data.diary);
            }
        }
        function createCategoryCss(categories) {
            $('style[name=css-category]').empty();
            const cssText = [];
            for (let i = 0, len = categories.length; i < len; i++ ) {
                const category = categories[i];
                cssText.push(`.${createCClass(category)} { background-color: ${category.color}; } 
                    .${createCBClass(category)} { border-color: ${category.color}; } 
                    .${createCBClass(category)}::after { border-top-color: ${category.color}; }`);
            }
            $('style[name=css-category]').text(cssText.join(' '));
        }
        function createCClass(category) {
            category.name = category.name === '카테고리 없음' ? 'none' : category.name;
            return `color-cate-${escape(category.name).replace(/\s/gm, '').replace(/%u/gm, '')}`;
        }
        function createCBClass(category) {
            category.name = category.name === '카테고리 없음' ? 'none' : category.name;
            return `color-cate-border-${escape(category.name).replace(/\s/gm, '').replace(/%u/gm, '')}`;
        }
        function getCurrBounds(map) {
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

        function saveScreenBounds() {
            const bnds = getCurrBounds(map);
            $.ajax({
                url: '/users/bnds',
                type: 'PUT',
                data: {
                    homeBounds: bnds
                },
                success: function(data) {
                    for (let key in bnds) {
                        $(`.home-bounds[name=${key}]`).val(bnds[key]);
                    }
                },
                error: function(req, stat, err) {
                }
            });
        }

        function setHomeBounds() {
            const bnds = {};
            $('.home-bounds').each(function(i, v) {
                const $v = $(v);
                bnds[$v.attr('name')] = $v.val();
            });
            const ne = new kakao.maps.LatLng(bnds.neLat, bnds.neLng),
                  sw = new kakao.maps.LatLng(bnds.swLat, bnds.swLng);
            map.setBounds(new kakao.maps.LatLngBounds(sw, ne));
            kakao.maps.event.trigger(map, 'dragend');
        }

        function clearCheckPressed() {
            clearInterval(checkSetLocPressed);
            checkSetLocPressed = null;
            pressedTime = 0;
        }
    }); 
});
