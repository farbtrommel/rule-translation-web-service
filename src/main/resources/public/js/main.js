function objectToText(content) {
    if (typeof content != "object") {
        return tmp;
    }
    var tmp = "";
    for (var i = 0; i < content.length; i++) {
        if (typeof content[i].outerHTML === "undefined") {
            tmp += content[i].documentElement.outerHTML + "\r\n";
        } else {
            tmp += content[i].outerHTML + "\r\n";
        }
    }
    return tmp;
}

function setCodeToField(qField, content, callback) {
    if (typeof content === "object") {
        tmp = objectToText(content);
        jQuery(qField).text(formatXml(tmp));
    } else {
        jQuery(qField).text(content);
    }

    if (callback) {
        callback(qField, content);
    }
}


function formatXml(xml) {
    xml = xml.replace(/\>\s+\</g, "><");
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    if (!xml.startsWith("<RuleML")) {
        xml = xml.replace(/\s?xmlns=\"[-a-zA-Z0-9@:%_\+.~#?&//=]*\"/, "");
    }
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function (index, node) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}

function updateCodeSample() {
    dmnSource().then(function (_dmnXml) {
        ruleMLSource(_dmnXml).then(function (_ruleMLXml, statusCode) {
            dmnXml = jQuery(jQuery.parseXML(_dmnXml));
            ruleMLXml = jQuery(_ruleMLXml);

            updateExplanation();
        });
    });
}

function dmnSource() {
    var dfd = jQuery.Deferred();
    viewer.saveXML({format: true}, function (err, data) {
        if (err != null) {
            dfd.reject(err);
        } else {
            dmnXml = jQuery(jQuery.parseXML(data));
            dfd.resolve(data);
        }

    });
    return dfd.promise();
}

function prepareDMN(dmnSource) {
    return dmnSource.replace('xmlns="http://www.omg.org/spec/DMN/20151101/dmn11.xsd"', 'xmlns="http://www.omg.org/spec/DMN/20151101/dmn.xsd"');
}

function ruleMLSource(dmnSource) {
    return jQuery.ajax({
        type: "POST",
        url: "api/translate/dmn/ruleml/",
        processData: false,
        contentType: 'application/xml',
        data: prepareDMN(dmnSource)
    });
}
function provaFromRuleML(rulemlSource) {
    return jQuery.ajax({
        type: "POST",
        url: "api/translate/ruleml/prova/",
        processData: false,
        contentType: 'application/xml',
        data: objectToText(rulemlSource)
    });
}


function loadProvaSerialization(qField, content) {
    //Load Prova
    var preProva = jQuery(qField + "-prova");
    if (preProva.length > 0 && preProva.text() == "") {
        provaFromRuleML(content).then(function (provaCode) {
            setCodeToField(qField + "-prova", provaCode);
        })
    }
}

function toggleCodeView(type) {
    jQuery(".btn-show-code-sample").removeClass("active");
    jQuery(".btn-show-code-sample[value=" + type + "]").addClass("active");

    if (type == "ruleml") {
        jQuery(".pp-ruleml").show();
        jQuery(".pp-prova").hide();
    } else {
        jQuery(".pp-ruleml").hide();
        jQuery(".pp-prova").show();
    }
}

function submit_post_via_hidden_form(url, params) {
    var f = $("<form target='_blank' method='POST' style='display:none;'></form>").attr({
        action: url
    }).appendTo(document.body);

    for (var i in params) {
        if (params.hasOwnProperty(i)) {
            $('<input type="hidden" />').attr({
                name: i,
                value: params[i]
            }).appendTo(f);
        }
    }

    f.submit();

    f.remove();
}

