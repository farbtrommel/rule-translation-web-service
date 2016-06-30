<div class="page-header">
    <h1>Decision Table</h1>
</div>

<p>DMN decision table describe a decision making process.
    This site present present a RuleML profile of DMN decision table.
    Choose one of the buttons below the table to inspect the translation.
    You welcome to change the decision table.
    After changing the decision table and before inspecting translation please click button "refresh code example",
    otherwise the changes can't be inspected.
</p>

<div class="row">
    <div class="col-md-12">
        <div id="table-holder"></div>
    </div>
</div>

<p class="text-center">

    <!--
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#ModalContent" data-type="dmn">Show XML serialization</button>
    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#ModalContent" data-type="ruleml">Show RuleML translation</button>
    -->
</p>

<div class="row">
    <div class="col-md-12 btn-group btn-group-justified center-block" role="group" aria-label="panel-explanation">
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-info update-code-sample">Refresh Code Example</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="serialization">Serialization</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="qualified-names">Qualified Names</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="input-expression">Input Expression
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="output-expression">Output Expression
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="rule">Rule</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="input-entry">Input Entry</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-control" value="output-entry">Output Entry</button>
        </div>
    </div>
</div>

<div class="dmn-doc"></div>

<article id="DecisionTableSerialization" class="panel-flow panel-serialization">
    <h2>Serialization</h2>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>:
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-dmn-table"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-ruleml pp-dmn-ruleml"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-prova pp-dmn-ruleml-prova" style="display:none;"></pre>
        </div>
    </div>
</article>

<article id="DecisionTableQualifiedNames" class="panel-flow panel-qualified-names">
    <h2>Qualified Names</h2>
    <div class="row">
        <div class="col-md-6">
            <b>Qualified names</b>
            <?prettify lang=xml linenums=false?>
                <pre class="pp-dmn prettyprint linenums">Valid Qualified Name=121
Another.Valid.Qualified.Name=date("«ISO Date Format»")</pre>
        </div>

        <div class="col-md-6">
            <b>Use Facts as key value storage in Prova</b>
            <?prettify lang=xml linenums=false?>
                <pre class="pp-dmn prettyprint linenums">context("Valid Qualified Name", 121);
context("Another.Valid.Qualified.Name", date("«ISO Date Format»"));</pre>
            <b>Facts as key value storage in RuleML</b>
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-dmn-context-predicates"></pre>
        </div>
    </div>
</article>

<article id="DecisionTableInputExpression" class="panel-flow panel-input-expression">
    <h2>Input Expression</h2>
    <div class="row">
        <div class="col-md-6">
            <b>Signature for Input Expressions</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-input-expression-signature"></pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-input-expression"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-ruleml pp-dmn-input-expression-translate"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="pp-dmn pp-dmn-dynamic pp-prova pp-dmn-input-expression-translate-prova"
                 style="display:none;"></pre>
        </div>
    </div>
</article>

<article id="DecisionTableOutputExpression" class="panel-flow panel-output-expression">
    <h2>Output Expression</h2>
    <div class="row">
        <div class="col-md-6">
            <b>Signature for Output Expressions</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-output-expression-signature"></pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-output-expression"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-ruleml pp-dmn-output-expression-translate"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-prova pp-dmn-output-expression-translate-prova"
                 style="display:none;"></pre>
        </div>
    </div>
</article>

<article id="DecisionTableRules" class="panel-flow panel-rule">
    <h2>Rules</h2>
    <div class="row">
        <div class="col-md-6">
            <b>Signature</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-rule-signature"></pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-rule"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-ruleml pp-dmn-rule-ruleml"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-prova pp-dmn-rule-ruleml-prova" style="display:none;"></pre>
        </div>
    </div>
</article>
<article id="DecisionTableInputEntry" class="panel-flow panel-input-entry">
    <h3>Input Entry</h3>
    <div class="row">
        <div class="col-md-6">
            <b>Signature of Input Entries</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-input-entry-signature"></pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-input-entry"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-ruleml pp-dmn-input-entry-ruleml"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-prova pp-dmn-input-entry-ruleml-prova"
                 style="display:none;"></pre>
        </div>
    </div>
</article>
<article id="DecisionTableOutputEntry" class="panel-flow panel-output-entry">
    <h3>Output Entry</h3>
    <div class="row">
        <div class="col-md-6">
            <b>Signature of Output Entries</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-output-entry-signature"></pre>
        </div>
    </div>
    <div class="row">
        <div class="col-md-6">
            <b>DMN</b>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-dmn-output-entry"></pre>
        </div>
        <div class="col-md-6">
            <div class="btn-group btn-group-justified" aria-label="panel-serialization">
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample active" value="ruleml">RuleML
                    </button>
                </div>
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-default btn-show-code-sample" value="prova">Prova</button>
                </div>
            </div>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-ruleml pp-dmn-output-entry-ruleml"></pre>
            <?prettify lang=xml linenums=false?>
            <pre class="prettyprint pp-dmn-dynamic pp-prova pp-dmn-output-entry-ruleml-prova"
                 style="display:none;"></pre>
        </div>
    </div>
</article>

<!--
<article id="DecisionTableHitPolicy">
    <h2>Hit Policy</h2>
    <p>Die Hit Policy wird über eine Builtin Function gelöst.</p>

    Single hit policies:
    <ul>
        <li>Unique</li>
        <li>Any</li>
        <li>Priority</li>
        <li>First</li>
    </ul>

    Multiple hit policies:
    <ul>
        <li>Output order</li>
        <li>Rule order</li>
        <li>Collect</li>
        <ul>
            <li>List</li>
            <li>Sum</li>
            <li>Count</li>
            <li>Min</li>
            <li>Max</li>
        </ul>
    </ul>
</article>
-->

<script src="/bower_components/dmn-js/dist/dmn-viewer.js"></script>
<script src="/bower_components/dmn-js/dist/dmn-modeler.js"></script>
<script src="/js/dmn-init.js"></script>
