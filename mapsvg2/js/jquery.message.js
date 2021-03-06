/*
 * jQuery message plug-in 1.0
 * http://bassistance.de/jquery-plugins/jquery-plugin-message/
 */
(function ($) {
    var helper, visible, timeout1, timeout2;
    $.fn.message = function (message) {
        message = $.trim(message || this.text());
        if (!message) {
            return;
        }
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        initHelper();
        helper.find("p").html(message);
        helper
            .show()
            .animate({ opacity: $.message.defaults.opacity }, $.message.defaults.fadeInDuration);
        visible = true;
        active = false;
        timeout1 = setTimeout(function () {
            visible = false;
        }, $.message.defaults.minDuration +
            $.message.defaults.displayDurationPerCharacter * Math.sqrt(message.length));
        timeout2 = setTimeout(fadeOutHelper, $.message.defaults.totalTimeout);
    };
    function initHelper() {
        if (!helper) {
            helper = $($.message.defaults.template).appendTo(document.body);
            $(window).bind("mousemove click keypress", fadeOutHelper);
        }
    }
    function fadeOutHelper() {
        if (helper.is(":visible") && !helper.is(":animated") && !visible) {
            helper.animate({ opacity: 0 }, $.message.defaults.fadeOutDuration, function () {
                $(this).hide();
            });
        }
    }
    $.message = {};
    $.message.defaults = {
        opacity: 0.8,
        fadeOutDuration: 500,
        fadeInDuration: 200,
        displayDurationPerCharacter: 40,
        minDuration: 900,
        totalTimeout: 6000,
        template: '<div class="jquery-message"><p></p></div>',
    };
})(jQuery);
