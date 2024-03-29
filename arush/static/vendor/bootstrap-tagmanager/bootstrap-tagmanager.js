/*


 */
"use strict";

(function (jQuery) {
    var SourceArray = ["Lombardia", "Abruzzo", "Toscana", "Liguria"];
    var SourceAjaxArray = new Array();

    var delimeters = new Array();
    var backspace = new Array();
    var inputObj = null;
    var tagList = new Array();
    var tagLiID = new Array();
    var lastTagId = 0;
    var hiddenTagList = null;

    var tagManagerOptions = null;

    var queuedTag = "";

    inputObj = this;

    jQuery.fn.trimTag = function (tag) {
        var txt = jQuery.trim(tag);

        var l = txt.length;
        var t = 0;

        //remove from end
        for (var i = l - 1; i >= 0; i--) {
            if (-1 != jQuery.inArray(txt.charCodeAt(i), delimeters)) {
                t++;
            } else
                break;
        }
        txt = txt.substring(0, l - t);
        l = txt.length;
        t = 0;
        //remove from head
        for (var i = 0; i < l; i++) {
            if (-1 != jQuery.inArray(txt.charCodeAt(i), delimeters)) {
                t++;
            } else
                break;
        }

        txt = txt.substring(t, l);

        return txt;
    };

    jQuery.fn.setupTypeahead = function (tag) {
        var obj = jQuery(this);

        if (!obj.typeahead)
            return;

        if (tagManagerOptions.typeaheadSource != null) {
            obj.typeahead();
            obj.data('active', true);
            obj.data('typeahead').source = tagManagerOptions.typeaheadSource;
            obj.data('active', false);
        } else if (tagManagerOptions.typeaheadAjaxSource != null) {
            obj.typeahead();
            jQuery.getJSON(tagManagerOptions.typeaheadAjaxSource, function (data) {
                if (data != undefined && data.tags != undefined) {
                    SourceAjaxArray.length = 0;
                    jQuery.each(data.tags, function (key, val) {
                        var a = 1;
                        //jQuery('#addexpenses select[name="who"]').append('<option value="' + val.who + '">' + val.name + '</option>');
                        SourceAjaxArray.push(val.tag);
                        //obj.attr("data-sources", SourceArray);
                        obj.data('active', true);
                        obj.data('typeahead').source = SourceAjaxArray;
                        obj.data('active', false);
                        //obj.attr("data-sources", SourceAjaxArray.join(", "));
                    });
                }
            });
        }
    };

    jQuery.fn.refreshHiddenTagList = function (robj) {
        var obj;
        if (robj == null)
            obj = jQuery(this);
        else
            obj = robj;

        var tlis = obj.data("tlis");
        var lhiddenTagList = obj.data("lhiddenTagList");

        if (lhiddenTagList == undefined)
            return;

        jQuery(lhiddenTagList).val(tlis.join(","));
    };

    jQuery.fn.spliceTag = function (TagId, robj) {
        var obj;
        if (robj == null)
            return;
        else
            obj = robj;
        var tlis = obj.data("tlis");
        var tlid = obj.data("tlid");

        var p = jQuery.inArray(TagId, tlid)
        if (-1 != p) {
            jQuery("#myTag_" + TagId).remove();
            tlis.splice(p, 1);
            tlid.splice(p, 1);
            obj.refreshHiddenTagList(obj);
        }

        if (tagManagerOptions.maxTags > 0 && tlis.length < tagManagerOptions.maxTags) {
            obj.show();
        }
    };

    jQuery.fn.popTag = function (robj) {
        var obj;
        if (robj == null)
            obj = jQuery(this);
        else
            obj = robj;

        var tlis = obj.data("tlis");
        var tlid = obj.data("tlid");

        if (tlid.length > 0) {
            var TagId = tlid.pop();
            tlis.pop();
            jQuery("#myTag_" + TagId).remove();
            jQuery(obj).refreshHiddenTagList();
        }
    };

    jQuery.fn.pushTag = function (tag, robj, isPrefilled) {

        if (!tag || tag.length <= 0) {
            return;
        }
        if (tagManagerOptions.CapitalizeFirstLetter && tag.length > 1) {
            tag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
        }

        // call the validator (if any) and do not let the tag pass if invalid
        if (tagManagerOptions.validator !== undefined) {
            if (tagManagerOptions.validator(tag) !== true) return;
        }

        var obj;
        if (robj == null)
            obj = jQuery(this);
        else
            obj = robj;

        var tlis = obj.data("tlis");
        var tlid = obj.data("tlid");

        if (!tag.match("^#")) {
            tag = '#' + tag
        }

        // dont accept new tags beyond the defined maximum
        if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) return;

        var alreadyInList = false;
        var p = jQuery.inArray(tag, $.map(tlis, function(value){
            return value.toLowerCase();
        }));
        if (-1 != p) {
            alreadyInList = true;
        }

        if (alreadyInList) {
            var pTagId = tlid[p];
            jQuery("#myTag_" + pTagId).stop().animate({ backgroundColor:tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor:tagManagerOptions.blinkBGColor_2 }, 100).animate({ backgroundColor:tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor:tagManagerOptions.blinkBGColor_2 }, 100).animate({ backgroundColor:tagManagerOptions.blinkBGColor_1 }, 100).animate({ backgroundColor:tagManagerOptions.blinkBGColor_2 }, 100);
        } else {
            var TagId = lastTagId++;
            tlis.push(tag);
            tlid.push(TagId);

            var html = '';
            html += '<span class="myTag" id="myTag_' + TagId + '"><span>' + tag + '&nbsp;&nbsp;</span><a href="#" class="myTagRemover" id="myRemover_' + TagId + '" TagIdToRemove="' + TagId + '" title="Removing tag">x</a></span>';

            obj.before(html);
            jQuery("#myRemover_" + TagId).on("click", obj, function (e) {
                e.preventDefault();
                var TagIdToRemove = parseInt(jQuery(this).attr("TagIdToRemove"));

                e.data.spliceTag(TagIdToRemove, e.data);
                tagManagerOptions.tagChangeCallback(this, tlis);
//            var TagIdToRemove = parseInt(jQuery(this).attr("TagIdToRemove"));
//            jQuery(this).spliceTag(parseInt(jQuery(this).attr("TagIdToRemove")));
            });

            obj.refreshHiddenTagList(obj);

            if (tagManagerOptions.maxTags > 0 && tlis.length >= tagManagerOptions.maxTags) {
                obj.hide();
            }

            if (!isPrefilled) tagManagerOptions.tagChangeCallback(this, tlis);
        }
        obj.val("");

    };

    jQuery.fn.tagsManager = function (options) {
        tagManagerOptions = {
            prefilled:null,
            CapitalizeFirstLetter:true,
            preventSubmitOnEnter:true,
            typeahead:false,
            typeaheadAjaxSource:null,
            typeaheadSource:null,
            delimeters:[44, 188, 13],
            backspace:[8],
            maxTags:0,
            inputTag:'<input type="text" name="TagList" class="tag" id="TagList" />',
            tagChangeCallback: function() {}
        };
        jQuery.extend(tagManagerOptions, options);

        return this.each(function () {
            // use baseObj instead obj to keep it hidden
            var baseObj = jQuery(this);
            // use inputTag for our visible input
            var obj = $(tagManagerOptions.inputTag);

            // return if element exist
            if (baseObj.parent().find("input[name='" + obj.attr('name') + "']").length > 0) {
                return;
            }

            //let's store some instance specific data directly into the DOM object
            var tlis = new Array();
            var tlid = new Array();
            obj.data("tlis", tlis); //list of string tags
            obj.data("tlid", tlid); //list of ID of the string tags

            // hide the element
            baseObj.hide();

            baseObj.after(obj);

            obj.data("lhiddenTagList", baseObj);

            var placeholder = baseObj.attr('placeholder');
            obj.attr('placeholder', placeholder);

            obj.click(function () {
                $(this).attr('placeholder', '');
            });

            obj.blur(function () {
                $(this).attr('placeholder', placeholder);
            });

            delimeters = tagManagerOptions.delimeters;
            backspace = tagManagerOptions.backspace;

            if (lastTagId > 0) {
                while (lastTagId > 0) {
                    obj.popTag(obj);
                    lastTagId--;
                }
            }

            if (tagManagerOptions.typeahead) {
                obj.setupTypeahead();
                //obj.typeahead({ source: SourceArray })
            }

            // disable submit on enter for this input field
            obj.on("focus", function (e) {
                if (jQuery(this).popover) {
                    jQuery(this).popover("hide");
                    //jQuery(this).popover = null;
                }
            });

            obj.on("keypress", function (e) {
                if (jQuery(this).popover) {
                    jQuery(this).popover("hide");
                    //jQuery(this).popover = null;
                }
                if (tagManagerOptions.preventSubmitOnEnter) {
                    if (e.which == 13) {
                        e.cancelBubble = true;
                        e.returnValue = false;
                        e.stopPropagation();
                        e.preventDefault();
                        //e.keyCode = 9;
                    }
                }
            });

            obj.on("keyup", obj, function (e) {
                if (e.which == 9) {
                    var ao = jQuery(".typeahead:visible");
                }
                var p = jQuery.inArray(e.which, delimeters);
                if (-1 != p) {
                    //user just entered a valid delimeter
                    var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                    user_input = jQuery(this).trimTag(user_input);
                    e.data.pushTag(user_input, e.data);
                }
            });

            obj.on("keydown", obj, function (e) {
                var p = jQuery.inArray(e.which, backspace);
                if (-1 != p) {
                    //user just entered backspace or equivalent
                    var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                    var i = user_input.length;
                    if (i <= 0) {
                        e.data.popTag();
                    }
                }
            });

            obj.change(function (e) {
                e.cancelBubble = true;
                e.returnValue = false;
                e.stopPropagation();
                e.preventDefault();

                var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
                var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
                var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
                var is_safari = navigator.userAgent.indexOf("Safari") > -1;

                if (!is_chrome && !is_safari)
                    jQuery(this).focus();

                var ao = jQuery(".typeahead:visible");
                if (ao[0] != undefined) {
                    //when the user click with the mouse on the typeahead li element we get the change event fired twice, once when the input field loose focus and later with the input field value is replaced with li value
                    var user_input = jQuery(".typeahead .active").attr("data-value");
                    user_input = jQuery(this).trimTag(user_input);
                    if (queuedTag == obj.val() && queuedTag == user_input) {
                        queuedTag = "";
                        obj.val(queuedTag);
                    } else {
                        jQuery(this).pushTag(user_input);
                        queuedTag = user_input;
                    }
                } else {
                    var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                    user_input = jQuery(this).trimTag(user_input);
                    jQuery(this).pushTag(user_input);
                }

            });

            if (1 == 1 || !tagManagerOptions.typeahead) {
                obj.on("blur", function (e) {
                    //lost focus
                    e.cancelBubble = true;
                    e.returnValue = false;
                    e.stopPropagation();
                    e.preventDefault();

                    var push = true;
                    if (tagManagerOptions.typeahead) {
                        var ao = jQuery(".typeahead:visible");
                        if (ao[0] != undefined) {
                            push = false;
                        } else {
                            push = true;
                        }
                    }

                    if (push) {
                        var user_input = jQuery(this).val(); //user_input = jQuery().inArray(delimeters[p]);
                        user_input = jQuery(this).trimTag(user_input);
                        jQuery(this).pushTag(user_input);
                    }
                });
            }

            if (tagManagerOptions.prefilled != null) {
                if (typeof (tagManagerOptions.prefilled) == "object") {
                    var pta = tagManagerOptions.prefilled;
                    jQuery.each(pta, function (key, val) {
                        var a = 1;
                        obj.pushTag(val, obj, true);
                    });
                } else if (typeof (tagManagerOptions.prefilled) == "string") {
                    var pta = tagManagerOptions.prefilled.split(',');

                    jQuery.each(pta, function (key, val) {
                        var a = 1;
                        obj.pushTag(val, obj, true);
                    });

                }
            }
        });

    }
})(jQuery);
