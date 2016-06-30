package de.farbtrommel.rtws.execution;

import ws.prova.exchange.ProvaSolution;
import ws.prova.reference2.ProvaVariableImpl;

import java.io.Serializable;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Wrap ProvaSolution to serializable object.
 */
public class ProvaResult implements Serializable {
    private List<HashMap<String, Object>>[] result;

    /**
     * Convert ProvaSolution to serializable object.
     *
     * @param obj
     */
    public ProvaResult(List<ProvaSolution[]> obj) {
        result = new List[obj.size()];
        for (int i = 0; i < obj.size(); i++) {
            result[i] = new LinkedList<>();
            for (ProvaSolution item : obj.get(i)) {
                HashMap<String, Object> tmp = new HashMap<>();
                for (Map.Entry<String, Object> o : item.getNv().entrySet()) {
                    if (o.getValue().getClass() == ProvaVariableImpl.class) {
                        tmp.put(o.getKey(), o.getValue().toString());
                    } else {
                        tmp.put(o.getKey(), o.getValue());
                    }
                }
                result[i].add(tmp);
            }
        }
    }

    public List<HashMap<String, Object>>[] getResult() {
        return result;
    }
}
