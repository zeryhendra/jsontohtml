function jsontohtml(jsonItem) {
    let p;
    if (jsonItem != null) { 
        switch (jsonItem?.type) {
            case 'TextElem': 
                p = document.createTextNode(jsonItem.textContent);
                break;

            case 'Elem':
                p = document.createElement(jsonItem.tagName);

                // attributes 
                if (typeof jsonItem.attributes != 'undefined' && jsonItem.attributes != null && jsonItem.attributes.length != null && jsonItem.attributes.length > 0) {
                    for (let no=0; no < jsonItem.attributes.length; no++) {
                        p.setAttribute(jsonItem.attributes[no][0], jsonItem.attributes[no][1]);
                    }
                }

                Array.from(jsonItem.children, child => {
                    const childElement = jsontohtml(child);
                    p.appendChild(childElement);
                });
                break;
                
            default: break;
        }
    }
    else {
        p = document.createElement(jsonItem.tagName);

        // attributes
        if (typeof jsonItem.attributes != 'undefined' && jsonItem.attributes != null && jsonItem.attributes.length != null && jsonItem.attributes.length > 0) {
            for (let no=0; no < jsonItem.attributes.length; no++) {
                p.setAttribute(jsonItem.attributes[no][0], jsonItem.attributes[no][1]);
            }
        }

        Array.from(jsonItem.children, child => {
            const childElement = jsontohtml(child);
            p.appendChild(childElement);
        });
    }

    return p;
}

