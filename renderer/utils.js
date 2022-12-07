class Utils {
  constructor() {}

  toFixed(x) {
    if (Math.abs(x) < 1.0) {
      var e = parseInt(x.toString().split("e-")[1]);
      if (e) {
        x *= Math.pow(10, e - 1);
        x = "0." + new Array(e).join("0") + x.toString().substring(2);
      }
    } else {
      var e = parseInt(x.toString().split("+")[1]);
      if (e > 20) {
        e -= 20;
        x /= Math.pow(10, e);
        x += new Array(e + 1).join("0");
      }
    }
    return x;
  }

  filterTable(table, text) {
    // Declare variables
    var filter,
      tr,
      td,
      i,
      txtValue;
    filter = text.toUpperCase();
    tr = $(table).find("tr");

    // Loop through all table rows, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {
      td = $(tr[i]).find("td")[0];

      if (td) {
        txtValue = td.textContent || td.innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
          $(tr[i]).css("display", "");
        } else {
          $(tr[i]).css("display", "none");
        }
      }
    }
  }

  createToolTip(element, text) {
    tippy(element, {
      content: text,
      delay: 500,
      arrow: true,
      arrowType: "round",
      size: "large",
      duration: 500,
      animation: "scale"
    });
  }
}

EticaUtils = new Utils();
