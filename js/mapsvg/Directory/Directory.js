import { Controller } from "../Core/Controller.js";
import { MapSVG } from "../Core/globals.js";
const $ = jQuery;
export class DirectoryController extends Controller {
    constructor(options) {
        super(options);
        this.repository = options.repository;
        this.noPadding = true;
        this.position = options.position;
        this.search = options.search;
    }
    getToolbarTemplate() {
        let t = '<div class="mapsvg-directory-search-wrap">';
        t += '<div class="mapsvg-directory-filter-wrap filter-wrap"></div>';
        t += "</div>";
        t += "</div>";
        return t;
    }
    viewDidLoad() {
        const _this = this;
        this.menuBtn = $('<div class="mapsvg-button-menu"><i class="mapsvg-icon-menu"></i> ' +
            this.mapsvg.options.mobileView.labelList +
            "</div>")[0];
        this.mapBtn = $('<div class="mapsvg-button-map"><i class="mapsvg-icon-map"></i> ' +
            this.mapsvg.options.mobileView.labelMap +
            "</div>")[0];
        if (MapSVG.isPhone && _this.mapsvg.options.menu.hideOnMobile) {
            if (this.mapsvg.options.menu.showFirst == "map") {
                this.toggle(false);
            }
            else {
                this.toggle(true);
            }
        }
        this.mobileButtons = $('<div class="mapsvg-mobile-buttons"></div>')[0];
        this.mobileButtons.append(this.menuBtn, this.mapBtn);
        if (this.mapsvg.options.menu.on !== false) {
            this.mapsvg.containers.wrapAll.appendChild(this.mobileButtons);
        }
        this.events.trigger("shown", this.containers.view);
    }
    setEventHandlers() {
        const _this = this;
        $(window).on("resize", function () {
            _this.updateTopShift();
        });
        $(this.menuBtn).on("click", function () {
            _this.toggle(true);
        });
        $(this.mapBtn).on("click", function () {
            _this.toggle(false);
            _this.mapsvg.redraw();
        });
        $(this.containers.view)
            .on("click.menu.mapsvg", ".mapsvg-directory-item", function (e) {
            if (e.target.nodeName == "A") {
                return;
            }
            const objID = $(this).data("object-id");
            let regions;
            let marker;
            let detailsViewObject;
            let eventObject;
            _this.deselectItems();
            _this.selectItems(objID, false);
            if (MapSVG.isPhone && _this.mapsvg.options.menu.showMapOnClick) {
                _this.toggle(false);
            }
            if (_this.mapsvg.options.menu.source == "regions") {
                regions = [_this.mapsvg.getRegion(objID)];
                eventObject = regions[0];
                detailsViewObject = regions[0];
            }
            else {
                detailsViewObject = _this.repository.getLoadedObject(objID);
                eventObject = detailsViewObject;
                const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                if (_regions) {
                    regions = _regions
                        .map(function (region) {
                        return _this.mapsvg.getRegion(region.id);
                    })
                        .filter(function (r) {
                        return r !== undefined;
                    });
                }
            }
            if (detailsViewObject.location && detailsViewObject.location.marker)
                marker = detailsViewObject.location.marker;
            if (_this.mapsvg.options.actions.directoryItem.click.showDetails) {
                _this.mapsvg.loadDetailsView(detailsViewObject);
            }
            if (regions && regions.length > 0) {
                if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                    _this.mapsvg.zoomTo(regions, _this.mapsvg.options.actions.directoryItem.click.zoomToLevel);
                }
                if (regions.length > 1) {
                    _this.mapsvg.setMultiSelect(true);
                }
                regions.forEach(function (region) {
                    const center = region.getCenter();
                    e.clientX = center[0];
                    e.clientY = center[1];
                    if (_this.mapsvg.options.actions.directoryItem.click.selectRegion) {
                        _this.mapsvg.selectRegion(region, true);
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.showRegionPopover) {
                        if (_this.mapsvg.options.actions.directoryItem.click.zoom) {
                            setTimeout(function () {
                                _this.mapsvg.showPopover(region);
                            }, 500);
                        }
                        else {
                            _this.mapsvg.showPopover(region);
                        }
                    }
                    if (_this.mapsvg.options.actions.directoryItem.click.fireRegionOnClick) {
                        _this.mapsvg.events.trigger("click.region", region, [region]);
                    }
                });
                if (regions.length > 1) {
                    _this.mapsvg.setMultiSelect(false, false);
                }
            }
            if (marker) {
                if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                    _this.mapsvg.zoomTo(marker, _this.mapsvg.options.actions.directoryItem.click.zoomToMarkerLevel);
                }
                if (_this.mapsvg.options.actions.directoryItem.click.showMarkerPopover) {
                    if (_this.mapsvg.options.actions.directoryItem.click.zoomToMarker) {
                        setTimeout(function () {
                            _this.mapsvg.showPopover(detailsViewObject);
                        }, 500);
                    }
                    else {
                        _this.mapsvg.showPopover(detailsViewObject);
                    }
                }
                if (_this.mapsvg.options.actions.directoryItem.click.fireMarkerOnClick) {
                    _this.mapsvg.events.trigger("click.marker", marker, [e, _this.mapsvg]);
                }
                _this.mapsvg.selectMarker(marker);
            }
            _this.events.trigger("click", this, [e, eventObject, _this.mapsvg]);
            const actions = _this.mapsvg.options.actions;
            if (actions.directoryItem.click.goToLink) {
                const linkParts = actions.directoryItem.click.linkField.split(".");
                let url;
                if (linkParts.length > 1) {
                    const obj = linkParts.shift();
                    const attr = "." + linkParts.join(".");
                    if (obj == "Region") {
                        if (regions[0] && regions[0].data)
                            url = eval("regions[0].data" + attr);
                    }
                    else {
                        if (detailsViewObject)
                            url = eval("detailsViewObject" + attr);
                    }
                    if (url) {
                        if (actions.directoryItem.click.newTab) {
                            const win = window.open(url, "_blank");
                            win.focus();
                        }
                        else {
                            window.location.href = url;
                        }
                    }
                }
            }
            if (actions.directoryItem.click.showAnotherMap) {
                if (_this.mapsvg.editMode) {
                    alert('"Show another map" action is disabled in the preview');
                    return true;
                }
                const linkParts2 = actions.directoryItem.click.showAnotherMapField.split(".");
                if (linkParts2.length > 1) {
                    const obj2 = linkParts2.shift();
                    const attr2 = "." + linkParts2.join(".");
                    let map_id;
                    if (obj2 == "Region") {
                        if (regions[0] && regions[0].data)
                            map_id = eval("regions[0].data" + attr2);
                    }
                    else {
                        if (detailsViewObject)
                            map_id = eval("detailsViewObject" + attr2);
                    }
                    if (map_id) {
                        const container = actions.directoryItem.click.showAnotherMapContainerId
                            ? $("#" + actions.directoryItem.click.showAnotherMapContainerId)[0]
                            : $(_this.mapsvg.containers.map)[0];
                        _this.mapsvg.loadMap(map_id, container);
                    }
                }
            }
        })
            .on("mouseover.menu.mapsvg", ".mapsvg-directory-item", function (e) {
            const objID = $(this).data("object-id");
            let regions;
            let detailsViewObject;
            let eventObject;
            let marker;
            if (_this.mapsvg.options.menu.source == "regions") {
                regions = [_this.mapsvg.getRegion(objID)];
                eventObject = regions[0];
                detailsViewObject = regions[0];
            }
            else {
                detailsViewObject = _this.repository.getLoadedObject(objID);
                eventObject = detailsViewObject;
                const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                if (_regions) {
                    regions = _regions.map(function (region) {
                        return _this.mapsvg.getRegion(region.id);
                    });
                }
                if (detailsViewObject.location) {
                    marker = detailsViewObject.location.marker;
                }
            }
            if (regions && regions.length) {
                _this.mapsvg.highlightRegions(regions);
            }
            if (marker) {
                _this.mapsvg.highlightMarker(marker);
                if (_this.mapsvg.options.actions.directoryItem.hover.centerOnMarker) {
                    _this.mapsvg.centerOn(marker);
                }
            }
            _this.events.trigger("mouseover", $(this), [e, eventObject, _this.mapsvg]);
        })
            .on("mouseout.menu.mapsvg", ".mapsvg-directory-item", function (e) {
            const objID = $(this).data("object-id");
            let regions;
            let detailsViewObject;
            let eventObject;
            let marker;
            if (_this.mapsvg.options.menu.source == "regions") {
                regions = [_this.mapsvg.getRegion(objID)];
                eventObject = regions[0];
                detailsViewObject = regions[0];
            }
            else {
                detailsViewObject = _this.repository.getLoadedObject(objID);
                eventObject = detailsViewObject;
                const _regions = detailsViewObject.getRegions(_this.mapsvg.regionsRepository.schema.name);
                if (_regions) {
                    regions = _regions.map(function (region) {
                        return _this.mapsvg.getRegion(region.id);
                    });
                }
                if (detailsViewObject.location) {
                    marker = detailsViewObject.location.marker;
                }
            }
            if (regions && regions.length) {
                _this.mapsvg.unhighlightRegions();
            }
            if (marker) {
                _this.mapsvg.unhighlightMarker();
            }
            _this.events.trigger("mouseout", $(this), [e, eventObject, _this.mapsvg]);
        });
        $(this.containers.contentView).on("click", ".mapsvg-category-item", function () {
            const panel = $(this).next(".mapsvg-category-block");
            if (panel[0].style.maxHeight || panel.hasClass("active")) {
                panel[0].style.maxHeight = null;
            }
            else {
                panel[0].style.maxHeight = panel[0].scrollHeight + "px";
            }
            if ($(this).hasClass("active")) {
                $(this).toggleClass("active", false);
                $(this).next(".mapsvg-category-block").addClass("collapsed").removeClass("active");
            }
            else {
                if (_this.mapsvg.options.menu.categories.collapseOther) {
                    $(this).parent().find(".mapsvg-category-item.active").removeClass("active");
                    $(this)
                        .parent()
                        .find(".mapsvg-category-block.active")
                        .removeClass("active")
                        .addClass("collapsed");
                }
                $(this).toggleClass("active", true);
                $(this).next(".mapsvg-category-block").removeClass("collapsed").addClass("active");
            }
            const panels = $(".mapsvg-category-block.collapsed");
            panels.each(function (i, panel) {
                panel.style.maxHeight = null;
            });
        });
    }
    highlightItems(ids) {
        const _this = this;
        if (typeof ids != "object")
            ids = [ids];
        ids.forEach(function (id) {
            $(_this.containers.view)
                .find("#mapsvg-directory-item-" + _this.convertId(id))
                .addClass("hover");
        });
    }
    unhighlightItems() {
        $(this.containers.view).find(".mapsvg-directory-item").removeClass("hover");
    }
    selectItems(ids, scrollTo = true) {
        if (typeof ids != "object")
            ids = [ids];
        ids.forEach((id) => {
            $(this.containers.view)
                .find("#mapsvg-directory-item-" + this.convertId(id))
                .addClass("selected");
        });
        if (scrollTo && $("#mapsvg-directory-item-" + ids[0]).length > 0) {
            this.scrollable &&
                $(this.containers.contentWrap).nanoScroller({
                    scrollTo: $(this.containers.view).find("#mapsvg-directory-item-" + this.convertId(ids[0])),
                });
        }
    }
    deselectItems() {
        $(this.containers.view).find(".mapsvg-directory-item").removeClass("selected");
    }
    removeItems(ids) {
        $(this.containers.view)
            .find("#mapsvg-directory-item-" + this.convertId(ids))
            .remove();
    }
    filterOut(items) {
        const _this = this;
        return items;
    }
    loadItemsToDirectory() {
        let items = [];
        const _this = this;
        if (!_this.repository.loaded)
            return false;
        if (_this.mapsvg.options.menu.categories &&
            _this.mapsvg.options.menu.categories.on &&
            _this.mapsvg.options.menu.categories.groupBy) {
            const categoryField = _this.mapsvg.options.menu.categories.groupBy;
            if (_this.repository.getSchema().getField(categoryField) === undefined ||
                _this.repository.getSchema().getField(categoryField).options === undefined) {
                return false;
            }
            const categories = _this.repository.getSchema().getField(categoryField).options;
            categories.forEach(function (category) {
                let dbItems = _this.repository.getLoaded();
                dbItems = _this.filterOut(dbItems);
                const itemArr = [];
                dbItems.forEach((item) => {
                    itemArr.push(item);
                });
                const catItems = itemArr.filter(function (object) {
                    if (categoryField === "regions") {
                        const objectRegions = typeof object[categoryField] !== "undefined" &&
                            object[categoryField].length
                            ? object[categoryField]
                            : [];
                        const objectRegionIDs = objectRegions.map(function (region) {
                            return region.id;
                        });
                        return objectRegionIDs.indexOf(category.id) !== -1;
                    }
                    else {
                        return object[categoryField] == category.value;
                    }
                });
                category.counter = catItems.length;
                if (categoryField === "regions") {
                    category.label = category.title;
                    category.value = category.id;
                }
                items.push({ category: category, items: catItems });
            });
            if (_this.mapsvg.options.menu.categories.hideEmpty) {
                items = items.filter(function (item) {
                    return item.category.counter > 0;
                });
            }
        }
        else {
            if (_this.mapsvg.options.menu.source === "regions") {
                items = _this.repository.getLoaded().map((r) => {
                    const data = r.getData();
                    data.objects = _this.mapsvg.getRegion(data.id).objects;
                    data.id_no_spaces = data.id.split(" ").join("_");
                    return data;
                });
            }
            else {
                items = _this.repository
                    .getLoaded()
                    .map((r) => r.getData(_this.mapsvg.regionsRepository.schema.name));
            }
        }
        try {
            $(this.containers.contentView).html(this.templates.main({ items: items }));
        }
        catch (err) {
            console.error('MapSVG: Error in the "Directory item" template');
            console.error(err);
        }
        if (items.length === 0) {
            $(this.containers.contentView).html('<div class="mapsvg-no-results">' +
                this.mapsvg.options.menu.noResultsText +
                "</div>");
        }
        if (_this.mapsvg.options.menu.categories.on) {
            if (_this.mapsvg.options.menu.categories.collapse && items.length > 1) {
                $(this.containers.contentView).find(".mapsvg-category-block").addClass("collapsed");
            }
            else if (_this.mapsvg.options.menu.categories.collapse && items.length === 1) {
                $(this.containers.contentView).find(".mapsvg-category-item").addClass("active");
                $(this.containers.contentView).find(".mapsvg-category-block").addClass("active");
                const panel = $(this.containers.contentView).find(".mapsvg-category-block")[0];
                if (panel)
                    panel.style.maxHeight = panel.scrollHeight + "px";
            }
            else if (!_this.mapsvg.options.menu.categories.collapse) {
                $(this.containers.contentView).find(".mapsvg-category-item").addClass("active");
                $(this.containers.contentView).find(".mapsvg-category-block").addClass("active");
                const panels = $(this.containers.contentView).find(".mapsvg-category-block");
                if (panels.length)
                    panels.each(function (i, panel) {
                        panel.style.maxHeight = panel.scrollHeight + "px";
                    });
            }
        }
        this.updateTopShift();
        this.updateScroll();
    }
    toggle(on) {
        const _this = this;
        if (on) {
            $(this.containers.main).parent().show();
            $(_this.mapsvg.containers.mapContainer).hide();
            $(this.menuBtn).addClass("active");
            $(this.mapBtn).removeClass("active");
        }
        else {
            $(this.containers.main).parent().hide();
            $(_this.mapsvg.containers.mapContainer).show();
            $(this.menuBtn).removeClass("active");
            $(this.mapBtn).addClass("active");
        }
        if (!$(this.containers.main).parent().is(":visible")) {
            if (MapSVG.isPhone) {
                $(_this.mapsvg.containers.wrap).css("height", "auto");
                _this.updateScroll();
            }
        }
        else {
            if (MapSVG.isPhone &&
                $(this.containers.main).height() < parseInt(this.mapsvg.options.menu.minHeight)) {
                $(_this.mapsvg.containers.wrap).css("height", parseInt(this.mapsvg.options.menu.minHeight) + "px");
                _this.updateScroll();
            }
        }
        this.updateTopShift();
    }
    addPagination(pager) {
        $(this.containers.contentView).append('<div class="mapsvg-pagination-container"></div>');
        $(this.containers.contentView).find(".mapsvg-pagination-container").html(pager);
    }
    convertId(id) {
        return (id + "")
            .split(" ")
            .join("_")
            .replace(/(:|\(|\)|\.|\[|\]|,|=|@)/g, "\\$1");
    }
}
//# sourceMappingURL=Directory.js.map