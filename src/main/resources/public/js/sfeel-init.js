jQuery(document).ready(function () {
    jQuery("input[name=options]").parent().click(function () {
        //dirty hack..
        setTimeout(function () {
            updateSFeelCode('.sfeel-ruleml-translation',
                jQuery('.s-feel-code').val(),
                "s-feel-code-math-jax");
        }, 100);
    });

    jQuery('.btn-translate').click(function () {
        updateSFeelCode('.sfeel-ruleml-translation',
            jQuery('.s-feel-code').val(),
            "s-feel-code-math-jax");
    });


    jQuery(".btn-show-code-sample").click(function (event) {
        toggleCodeView(event.target.value);
    });

    jQuery("input[id^=arithmetic]").on('change', function () {
        updateSFeelCode('.s-feel-pp-arithmetic',
            jQuery('input[name=arithmetic]:checked').val(),
            "s-feel-rule-arithmetic-example", "Atom")
    });

    jQuery('.btn-interval-start').click(function (event) {
        var el = jQuery(event.target);
        jQuery('.btn-interval-start').removeClass('active');
        el.addClass('active');
        loadInterval();
    });

    jQuery('.btn-interval-end').click(function (event) {
        var el = jQuery(event.target);
        jQuery('.btn-interval-end').removeClass('active');
        el.addClass('active');
        loadInterval();
    });

    jQuery('.btn-unary-test').click(function (event) {
        var el = jQuery(event.target);
        while (!el.hasClass('btn')) {
            el = el.parent();
        }
        jQuery('.btn-unary-test').removeClass('active');
        el.addClass('active');
        loadUnaryTest();
    });


    initSFeel();
});

function initSFeel() {
    updateSFeelCode('.sfeel-ruleml-translation',
        jQuery('.s-feel-code').val(),
        "s-feel-code-math-jax");

    updateSFeelCode('.s-feel-pp-arithmetic',
        jQuery('input[name=arithmetic]:checked').val(),
        "s-feel-rule-arithmetic-example", "Atom");

    loadInterval();
    loadUnaryTest();
}

function updateSFeelCode(qField, code, _mathjax, xmlFind) {
    jQuery(qField + "-prova").text("");

    if (typeof xmlFind == "undefined") {
        xmlFind = "Implies";
    }
    var mode = jQuery(".active input[name=options]").val();
    jQuery.ajax({
        type: "POST",
        url: "/api/translate/sfeel/ruleml/?mode=" + mode,
        processData: false,
        contentType: 'text/plain',
        data: code + "\r\n",
        success: function (data) {
            var xml = jQuery(data);
            setCodeToField(qField, xml.find(xmlFind).first(), function (_qField, content) {
                jQuery(qField).removeClass("prettyprinted");
                prettyPrint();
                loadProvaSerialization(_qField, content);
            });
        }
    });

    if (typeof _mathjax != "undefined") {
        try {
            var math = MathJax.Hub.getAllJax(_mathjax)[0];
            if (_mathjax == "s-feel-code-math-jax") {
                if (mode == "assign") {
                    code = "X := " + code;
                } else {
                    code = "X = " + code;
                }
            }
            mathCodeToDiv(math, code);
        } catch (ex) {
            //TODO: exception handling
        }
    }
}

function loadInterval() {
    var typeStart = jQuery('button.btn-interval-start.active').val();
    var typeEnd = jQuery('button.btn-interval-end.active').val();
    var start = jQuery('.interval-start').val();
    var end = jQuery('.interval-end').val();

    updateSFeelCode(".s-feel-interval",
        typeStart + start + " .. " + end + typeEnd,
        "s-feel-interval-example", "And");
}

function loadUnaryTest() {
    var test = jQuery('button.btn-unary-test.active').val();
    var val = jQuery('input.unary-test').val();

    updateSFeelCode(".s-feel-unary-test",
        test + " " + val,
        "s-feel-unary-test-example", "Atom");
}

function mathCodeToDiv(div, code) {
    code = code.replace(/\s*<\s*=\s*/, " \\leq ");
    code = code.replace(/\s*>\s*=\s*/, " \\geq ");
    code = code.replace(/\*/, "\\cdot");
    MathJax.Hub.Queue(["Text", div, "\\displaystyle{" + code + "}"]);
}