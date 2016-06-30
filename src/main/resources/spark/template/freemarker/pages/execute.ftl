<div class="page-header">
    <h1>Execute a DMN decision table with Prova</h1>
</div>

<p>
    The purpose of this site is to show how a DMN decision table works.
    "InvokeDecisionTable" is a DMN Invocation Box and provide the parameters for the decision table to determine the decision.
    Click "Execution Decision" to calculate the result.
    After processing is done all valid cells will be colored blue. The result will be shown below the decision table.
    When you add to decision table new qualified names, please click "Refresh" to update the invocation box.
</p>

<div class="row">
    <div class="col-md-12 btn-group btn-group-justified center-block" role="group" aria-label="panel-examples">
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-example" value="0">Example 1</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-example" value="1">Example 2
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default panel-example" value="2">Example 3
            </button>
        </div>
    </div>
</div>
<p>&nbsp;</p>

<div class="row">
    <div class="col-md-12">
        <div id="boxed-invocation" class="dmn-table tjs-container">
            <header>
                <h3 contenteditable="true">InvokeDecisionTable</h3>
                <div class="tjs-table-id mappings">decisionTable</div>
            </header>
            <table class="table">
                <thead>
                <tr>
                    <td>Item</td>
                    <td>Value</td>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>input1</td>
                    <td contenteditable="true">12</td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>


<p>&nbsp;</p>

<div class="row">
    <div class="col-md-12">
        <div id="table-holder"></div>
    </div>
</div>

<p>&nbsp;</p>

<div class="row">
    <div class="col-md-12 btn-group btn-group-justified center-block" role="group" aria-label="panel-explanation">
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-info update-code-sample">Refresh</button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default run-code-sample" value="serialization">Execute Decision
            </button>
        </div>
        <div class="btn-group" role="group">
            <button type="button" class="btn btn-default show-code-sample" value="serialization">Show Source Code
            </button>
        </div>
    </div>
</div>
<p>&nbsp;</p>
<div class="row">
    <div class="col-md-12" style="min-height: 200px;">
        <div class="msg"></div>
        <div class="prova-code" style="display:none;">
            <p><b>Prova Solution to JSON / Prova Source Code</b>:</p>
            <pre class="run-code-sample-result"></pre>
        </div>
    </div>
</div>


<script src="/bower_components/dmn-js/dist/dmn-viewer.js"></script>
<script src="/bower_components/dmn-js/dist/dmn-modeler.js"></script>
<script src="/js/execute-prova.js"></script>