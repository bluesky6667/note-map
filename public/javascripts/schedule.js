'use strict';

(function(window, factory) {
    window.Schedule = factory(window.$, window.Note);
})(this, function($, Note) {
    class Schedule extends Note {
        constructor(options) {
            super(options);
            this.currDate = new Date();
            this.calendarDate = new Date();
            this.calendarDate.setSeconds(0);
            this.schedMarker = options.schedMarker;
            this.className = 'calendar';
            this.resizeFn = () => { this.resizeCalendar(this); };
            this.getScheduleList(true);
        }
        getScheduleList(init, callback, day) {
            const _this = this;
            const paramDate = new Date(this.calendarDate);
            $.get({
                url: '/sched',
                data: {
                    date: paramDate,
                    day: day
                },
                success: function(scheds) {
                    if (init) {
                        _this.makeCalendar(scheds, paramDate);
                        _this.close();
                    } else {
                        if (day) {
                            $(`.date-num:contains(${paramDate.getDate()})`).filter(function() {
                                return $(this).text() == paramDate.getDate();
                            }).closest('.date-container').find('.sched-list-box').empty();
                            _this.writeScheds(scheds, paramDate);
                        } else {
                            _this.buildCalendar(scheds, paramDate);
                        }
                    }
                    if (typeof callback === 'function') {
                        callback(scheds);
                    }
                },
                error: function(req, stat, err) {
                }
            });
        }
        getSchedule(schedId) {
            const _this = this;
            if (schedId) {
                $.get({
                    url: '/sched/'+ schedId,
                    success: function(sched) {
                        const schedDate = new Date(sched.startTime);
                        const date = schedDate.getDate();
                        if (!_this.compareDate(_this.calendarDate, schedDate)) {
                            _this.setCalendarDate(schedDate);
                            _this.getScheduleList(false, (scheds) => {
                                $(`.date-num:contains(${date})`).filter(function() {
                                    return $(this).text() == date;
                                }).closest('.date-container').trigger('click');
                                _this.makeSchedInfoFrame();
                                _this.setSchedInfo(sched);
                            });
                        } else if (!$('.detail-view')[0]) {
                            $(`.date-num:contains(${date})`).filter(function() {
                                return $(this).text() == date;
                            }).closest('.date-container').trigger('click');
                            _this.makeSchedInfoFrame();
                            _this.setSchedInfo(sched);
                        } else {
                            _this.setSchedInfo(sched);
                        }
                    },
                    error: function(req, stat, err) {
                    }
                });
            }
        }
        compareDate(date, another, toDate) {
            if (toDate) {
                return date.getFullYear() === another.getFullYear() 
                && date.getMonth() === another.getMonth()
                && date.getDate() === another.getDate();
            }
            return date.getFullYear() === another.getFullYear() 
                && date.getMonth() === another.getMonth();
        }
        setSchedInfo(sched) {
            const $schedDetailInfo = this.$note.find('.sched-detail-info');
            $schedDetailInfo.find('input[name=schedId]').val(sched._id);
            $schedDetailInfo.find('.sched-contents').val(sched.contents);
            this.setPlace(sched);
            const startTime = new Date(sched.startTime);
            const endTime = new Date(sched.endTime);
            $schedDetailInfo.find('.select-hr.start-time').val(startTime.getHours());
            $schedDetailInfo.find('.select-min.start-time').val(startTime.getMinutes());
            $schedDetailInfo.find('.select-hr.end-time').val(endTime.getHours());
            $schedDetailInfo.find('.select-min.end-time').val(endTime.getMinutes());
        }
        setPlace(place = {place: '', placeLat: '', placeLng: ''}) {
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
        setSearchingPlace(place = {place: '', placeLat: '', placeLng: ''}) {
            this.$note.find('input[name=temp-place]').val(place.place);
            this.$note.find('input[name=temp-placeLat]').val(place.placeLat);
            this.$note.find('input[name=temp-placeLng]').val(place.placeLng);
        }
        makeCalendar(scheds, schedDate) {
            const _this = this;
            const $calendar = this.make();
            this.open(true);
            this.makeCalendarFrame();
            this.buildCalendar(scheds, schedDate);
            
            $calendar.resizable({
                containment: 'body',
                minWidth: 622,
                maxWidth: 900,
                minHeight: 570,
                maxHeight: 800,
                resize: this.resizeFn
            });
        }
        makeCalendarFrame(date = this.calendarDate) {
            const _this = this;
            const selectableY = [];
            const $calendar = this.$note;
            $calendar.append('<input type="hidden" name="temp-place"><input type="hidden" name="temp-placeLat"><input type="hidden" name="temp-placeLng">');
            const yy = date.getFullYear();
            const mm = date.getMonth() + 1;            
            for (let i = yy-10; i < yy+10; i++) {
                selectableY.push(`<option value="${i}">${i}</option>`);
            }
            $(`<div class="datepicker-box">
                <button class="move-mm icon-left-arrow" id="prev-mm"></button>
                <span class="curr-date">
                    <select class="curr-yy">${selectableY.join('')}</select>
                    <span class="curr-mm">${mm}</span>
                </span>
                <button class="move-mm icon-right-arrow" id="next-mm"></button>
            <div>`).appendTo($calendar);
            $calendar.find('.curr-yy').val(yy);
            $calendar.find('.curr-yy').on('focus', function(e) {
                this.size = 10;
            }).on('blur', function(e) {
                this.size = 1;
            }).on('change', function(e) {
                const date = _this.calendarDate;
                this.size = 1;
                this.blur();
                date.setFullYear(this.value);
                $('.curr-yy').val(date.getFullYear());
                _this.getScheduleList();
            });
            $calendar.find('.move-mm').on('click', function(e) {
                const date = _this.calendarDate;
                if (this.id === 'prev-mm') {
                    date.setMonth(date.getMonth() - 1);
                } else {
                    date.setMonth(date.getMonth() + 1);
                }
                if ($(`.curr-yy option[value=${date.getFullYear()}]`)[0]) {
                    $('.curr-yy').val(date.getFullYear());
                    $('.curr-mm').text(date.getMonth() + 1);
                    $('.detail-view').removeClass('detail-view');
                    $calendar.find('tr, td').show();
                    _this.getScheduleList();
                } else {
                    if (this.id === 'prev-mm') {
                        date.setMonth(date.getMonth() + 1);
                    } else {
                        date.setMonth(date.getMonth() - 1);
                    }
                }
            });
            $(`<table class="calendar-table">
                <colgroup>
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                    <col style="width: 14.2%">
                </colgroup>
                <tr>
                <th>일</th><th>월</th><th>화</th><th>수</th><th>목</th><th>금</th><th>토</th>
                </tr>
            </table>`).appendTo($calendar); 
            $calendar.on('click', '.date-container', function(e) {
                if ($(this).find('.date-head')[0] && !$(this).hasClass('detail-view')) {
                    _this.calendarDate.setDate($(this).find('.date-num').text())
                    $(this).closest('tr').siblings().hide();
                    $(this).closest('td').siblings().hide();
                    $(this).addClass('detail-view');

                    if ($(e.target).is('.sched-preview')) {
                        _this.makeSchedInfoFrame(e.target.dataset.schedId);
                    } else if ($(this).find('.sched-preview')[0]) {
                        _this.makeSchedInfoFrame($(this).find('.sched-preview')[0].dataset.schedId);
                    } else {
                        _this.msgNoSched();
                    }
                    _this.resizeSchedListBox(_this.$note);
                } else if ($(this).hasClass('detail-view') && $(e.target).is('.sched-preview')) {
                    _this.makeSchedInfoFrame(e.target.dataset.schedId);
                }
            });
            $calendar.on('click', '.return-calendar', function(e) {
                e.stopPropagation();
                $('.detail-view').removeClass('detail-view');
                $calendar.find('tr, td').show();
                _this.resizeSchedListBox(_this.$note);
            });
            $calendar.on('click', '.add-sched', function(e) {
                e.stopPropagation();
                _this.makeSchedInfoFrame();
            });
            $calendar.on('click', '.save-sched', function(e) {
                e.stopPropagation();
                _this.saveSched();
            });
            $calendar.on('click', '.delete-sched', function(e) {
                e.stopPropagation();
                if (confirm('정말 삭제하시겠습니까?')) {
                    _this.deleteSched($calendar.find('input[name=schedId]').val());
                }                
            });
            $calendar.on('click', '.remove-place', function(e) {
                e.stopPropagation();
                if (confirm('정말 삭제하시겠습니까?')) {
                    _this.setPlace();
                }                
            });
        }
        buildCalendar(scheds, schedDate) {
            const date = this.calendarDate;
            const $clndTable = $('.calendar-table');
            $clndTable.find('tr:not(:eq(0))').remove();
            const firstDate = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDate = new Date(date.getFullYear(), date.getMonth()+1, 0);
            const firstDay = firstDate.getDay();
            let cnt = firstDay;
            const $firstRow = $('<tr></tr>').appendTo($clndTable);
            for (let i = 0; i < firstDay; i++) {
                $firstRow.append('<td></td>');
            }
            for (let i = 1; i < lastDate.getDate()+1; i++) {
                if ( cnt !== 0 && cnt % 7 === 0 ) {
                    $clndTable.append('<tr></tr>');
                }
                $clndTable.find(`tr:eq(${Math.floor(cnt/7) + 1})`)
                .append(`<td>
                    <div class="date-container">
                    <div class="date-head">
                        <button class="icon-back return-calendar"></button>
                        <span class="date-num">${i}</span>
                    </div>
                    <div class="sched-detail"></div>
                    <div class="sched-area">
                        <button class="icon-add add-sched"></button>
                        <div class="sched-list-box"></div>
                    </div>
                    </div>
                </td>`);
                cnt++;
            }
            this.resizeFn();
            this.writeScheds(scheds, schedDate);
        }
        resizeCalendar(scheduleSheet) {
            const $thisC = scheduleSheet.$note;
            const totalH = $thisC.height();
            const headerH = $thisC.find('.note-header').outerHeight(true);
            const optH = $thisC.find('.datepicker-box').outerHeight(true);
            const calendarH = (totalH - headerH - optH);
            $thisC.find('.calendar-table').css('height', calendarH +'px');
            scheduleSheet.resizeSchedListBox($thisC, calendarH);
        }
        resizeSchedListBox($calendar, calendarH) {
            if ( typeof calendarH === 'undefined') {
                const totalH = $calendar.height();
                const headerH = $calendar.find('.note-header').outerHeight(true);
                const optH = $calendar.find('.datepicker-box').outerHeight(true);
                calendarH = (totalH - headerH - optH);
            }
            const $detailView = $calendar.find('.detail-view');
            if ($detailView[0]) {
                const schedListBoxH = calendarH - 4 -20 -29 - 12 - 25 - 10 - 10;
                $detailView.find('.sched-list-box').css('height', schedListBoxH + 'px');
            } else {
                const dateTrLen = $calendar.find('.calendar-table tr').length - 1;
                const schedListBoxH = Math.floor((calendarH - $calendar.find('tr:eq(0)').outerHeight()) / (dateTrLen)) - 20 - (dateTrLen * 2);
                $calendar.find('.sched-list-box').css('height', schedListBoxH + 'px');
            }   
        }
        makeSchedInfoFrame(schedId) {
            const $calendar = this.$note;
            const $detailView = $calendar.find('.detail-view .sched-detail');
            const hrOpts = [];
            const minOpts = [];
            for (let i = 0; i < 24; i++) {
                hrOpts.push(`<option value="${i}">${i}</option>`);
            }
            for (let i = 0; i < 60; i++) {
                minOpts.push(`<option value="${i}">${i}</option>`);
            }
            $detailView.empty();
            $detailView.append(
                `<div class="sched-detail-info">
                    <input type="hidden" name="schedId" >
                    <div class="search-box-tr"><span class="symbol icon-clock" title="기간"></span>
                        <select class="select-hr start-time">${hrOpts.join('')}</select><select class="select-min start-time">${minOpts.join('')}</select> - 
                        <select class="select-hr end-time">${hrOpts.join('')}</select><select class="select-min end-time">${minOpts.join('')}</select>
                    </div>
                    <div class="search-box-tr">
                        <span class="symbol icon-map" title="장소"></span>
                        <span class="place-name" ></span><span class="remove-place" style="display: none;"></span>
                        <input type="hidden" name="place" >
                        <input type="hidden" name="placeLat" >
                        <input type="hidden" name="placeLng" >
                        <button class="icon-search search-place" title="장소 검색"></button>
                    </div>
                    <textarea class="sched-contents" style="resize: none;" />
                </div>
                <div class="sched-detail-footer">
                    <button class="save-sched">저 장</button><button class="delete-sched" ${!schedId ? 'style="display: none;"' : ''}>삭 제</button>
                </div>`);
            $detailView.find('.start-time').each(function(i, v) {
                v.firstElementChild.selected = true;
            });
            $detailView.find('.end-time').each(function(i, v) {
                v.lastElementChild.selected = true;
            });
            if (schedId) {
                this.getSchedule(schedId);
            }
        }
        msgNoSched() {
            const $calendar = this.$note;
            const $detailView = $calendar.find('.detail-view .sched-detail');
            $detailView.empty();
            $detailView.append('<div class="no-sched">선택된 스케줄이 없습니다.</div>');
        }
        saveSched() {
            const _this = this;
            const sched = this.getSchedInfo();
            if (sched.schedId) {
                $.ajax({
                    url: '/sched',
                    type: 'PUT',
                    data: sched,
                    success: function(result) {
                        _this.getScheduleList(false, () => {
                            _this.msgNoSched();
                            _this.getSchedMarkerByMoveEnd(_this.map);
                        }, true);
                    },
                    error: function(req, stat, err) {
                        alert('저장 실패');
                    }
                });
            } else {
                $.post({
                    url: '/sched',
                    data: sched,
                    success: function(result) {
                        _this.addSchedPreview(result);
                        _this.msgNoSched();
                        _this.getSchedMarkerByMoveEnd(_this.map);
                    },
                    error: function(req, stat, err) {
                        alert('저장 실패');
                    }
                });
            }
        }
        addSchedPreview(sched) {
            this.$note.find('.date-container.detail-view .sched-list-box')
            .prepend(`<div class="sched-preview" data-sched-id="${sched._id}">${sched.contents}</div>`);
        }
        getSchedMarkerByMoveEnd(map) {
            const _this = this;
            const date = new Date();
            date.setMinutes(date.getMinutes()-30);
            $.get({
                url: '/sched/marker',
                data: {
                    date: date,
                    bounds: _this.getCurrBounds(map)
                },
                success: function(data) {
                    _this.makeSchedMarker(map, data.sched);
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
        makeSchedMarker(map, scheds) {
            this.clearMarker();
            for (let i = 0; i < scheds.length; i++) {
                const sched = scheds[i];
                this.makeMarkerBySched(map, sched);
            }
        }
        clearMarker() {
            if ( this.schedMarker ) {
                for (let id in this.schedMarker) {
                    this.removeMarkerById(id);
                }
            }
        }
        removeMarkerById(schedId) {
            const sched = this.schedMarker[schedId];
            sched.setMap(null);
            this.schedMarker[schedId] = null;
            delete this.schedMarker[schedId];
        }
        makeMarkerBySched(map, sched) {
            if (sched.place) {
                const _this = this;
                const marker = this.createSchedMarker(sched);
                marker.data = sched;
                marker.setMap(map);
                $(`.marker-sched[data-sched-id=${sched._id}]`)[0].addEventListener('click', function(e) {
                    _this.open();
                    _this.getSchedule(this.dataset.schedId);
                });
                this.schedMarker[sched._id] = marker;
            }        
        }
        createSchedMarker(sched) {
            return new kakao.maps.CustomOverlay({
                position: new kakao.maps.LatLng(sched.placeLat, sched.placeLng),
                content: `<div class="marker-sched" data-sched-id="${sched._id}"></div>`,
                yAnchor: 1.4
            });
        }
        deleteSched(schedId) {
            const _this = this;
            $.ajax({
                url: '/sched',
                type: 'DELETE',
                data: {schedId: schedId},
                success: function(data) {
                    $(`.sched-preview[data-sched-id=${schedId}]`).remove();
                    _this.msgNoSched();
                    _this.getSchedMarkerByMoveEnd(_this.map);
                },
                error: function(req, stat, err) {
                    alert('삭제 실패');
                }
            });
        }
        getSchedInfo() {
            const $schedInfo = this.$note.find('.detail-view .sched-detail-info');
            const schedInfo = {
                startTime: new Date(this.calendarDate),
                endTime: new Date(this.calendarDate),
                contents: $schedInfo.find('.sched-contents').val()
            };
            schedInfo.startTime.setHours($schedInfo.find('.start-time.select-hr').val());
            schedInfo.startTime.setMinutes($schedInfo.find('.start-time.select-min').val());
            schedInfo.endTime.setHours($schedInfo.find('.end-time.select-hr').val());
            schedInfo.endTime.setMinutes($schedInfo.find('.end-time.select-min').val());
            $schedInfo.find('input').each(function(i, v) {
                schedInfo[v.name] = v.value;
            });
            return schedInfo;
        }
        writeScheds(scheds = [], schedDate) {
            if (schedDate && schedDate.getTime() == this.calendarDate.getTime()) {
                for (let i = 0, len = scheds.length; i < len; i++) {
                    const sched = scheds[i];
                    const date = new Date(sched.startTime).getDate();
                    
                    $(`.date-num:contains(${date})`).filter(function() {
                        return $(this).text() == date;
                    }).closest('.date-container').find('.sched-list-box')
                    .append(`<div class="sched-preview" data-sched-id="${sched._id}">${sched.contents}</div>`);
                }
            }
        }
        openSched(schedId) {
            this.open();
        }
        shortCutWriteSched(info) {
            this.setCalendarDate(new Date());
            const date = this.calendarDate.getDate();
            this.getScheduleList(false, (scheds) => {
                $(`.date-num:contains(${date})`).filter(function() {
                    return $(this).text() == date;
                }).closest('.date-container').trigger('click');
                this.makeSchedInfoFrame();
                this.setPlace(info);
            });
        }
        setCalendarDate(date) {
            this.calendarDate = date;
            $('.curr-yy').val(date.getFullYear());
            $('.curr-mm').text(date.getMonth()+1);
            this.buildCalendar();
        }
    }
    return Schedule;
});