/* json to html */
function jsontohtml(t, newItem) {
    let p, n;
    if (newItem != null) { 
        switch (newItem?.type) {
            case 'TextElem': 
                n = newItem.textContent;
                t.append(n)
                break;

            case 'Elem':
                n = document.createElement(newItem.tagName);

                // attributes 
                if (typeof newItem.attributes != 'undefined' && newItem.attributes != null && newItem.attributes.length != null && newItem.attributes.length > 0) {
                    for (let no=0; no < newItem.attributes.length; no++) {
                        n.setAttribute(newItem.attributes[no][0], newItem.attributes[no][1]);
                    }
                }

                t.append(n);
                
                Array.from(newItem.children, i => {
                    return jsontohtml( n , i );
                })
                break;
                
            default: break;
        }
        
    }
    else {
        p = document.createElement(t.tagName);

        // attributes
        if (typeof t.attributes != 'undefined' && t.attributes != null && t.attributes.length != null && t.attributes.length > 0) {
            for (let no=0; no < t.attributes.length; no++) {
                p.setAttribute(t.attributes[no][0], t.attributes[no][1]);
            }
        }

        Array.from(t.children, i => {
            return jsontohtml( p, i )
        })
    }

    
    if (p === undefined || p === null) {
        // console.log('Null or undefined value!')
    }
    else {
        // console.log(p)
        return p;
    }
}