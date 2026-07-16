fetch('https://maps.app.goo.gl/sMpxr2B4U7A5fCq66').then(r => r.text()).then(t => console.log(t.substring(0, 500))).catch(e => console.error(e));
