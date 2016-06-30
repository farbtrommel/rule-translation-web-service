<!DOCTYPE html>
<html>
<head>
<#include "header.ftl">
</head>

<body>

<#include "nav.ftl">

<div class="container ${path}">
<#if path == "home">
    <#include "pages/home.ftl">
<#elseif path == "decision-table">
    <#include "pages/decisiontable.ftl">
<#elseif path == "s-feel">
    <#include "pages/s-feel.ftl">
<#elseif path == "doc">
    <#include "pages/doc.ftl">
<#elseif path == "execute">
    <#include "pages/execute.ftl">
<#else>
    ...
</#if>

</div>

<!-- <script src="js/dmn-init.js"></script> -->

<div class="modal fade" id="ModalContent" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-body">
                <pre class="prettyprint"></pre>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>
</body>
</html>
