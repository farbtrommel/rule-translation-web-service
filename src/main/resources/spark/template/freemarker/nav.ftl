<nav class="navbar navbar-default navbar-static-top navbar-inverse">
    <div class="container">
        <div class="navbar-header">
            <a class="navbar-brand" href="/">Profile: DMN to RuleML</a>
        </div>
        <ul class="nav navbar-nav">
            <li <#if path="home"> class="active" </#if>>
                <a href="/"><span class="glyphicon glyphicon-home"></span> Home</a>
            </li>
            <li <#if path="s-feel"> class="active" </#if>>
                <a href="/s-feel"><span class="glyphicon glyphicon-th"></span> S-FEEL</a>
            </li>
            <li <#if path="decision-table"> class="active" </#if>>
                <a href="/decision-table"><span class="glyphicon glyphicon-list-alt"></span> Decision Table</a>
            </li>
            <li <#if path="execute"> class="active" </#if>>
                <a href="/execute"><span class="glyphicon glyphicon-play"></span> Execution</a>
            </li>
            <li <#if path="doc"> class="active" </#if>>
                <a href="/doc"><span class="glyphicon glyphicon-transfer"></span> API</a>
            </li>
        </ul>
    </div>
</nav>
