import './spinner.css';

class Spinner {
  constructor(containerEl) {
    //spinner-1
    let loadingObj = document.createElement("a");
    loadingObj.className = 'spinner-loader';
    loadingObj.id = 'spinner-loader';
    if (containerEl) {
      containerEl.appendChild(loadingObj);
    } else {
      document.body.appendChild(loadingObj);
    }
  }

  remove = () => {
    // document.getElementById('spinner-loader').style.display = 'none';
    if (document.getElementById('spinner-loader')) {
      document.getElementById('spinner-loader').remove();
    }
  }
}
export default Spinner;