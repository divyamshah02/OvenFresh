function toggle_loader() {
    try{
        document.getElementById('offcanvasNavbar').classList.toggle('none-div');
    }
    catch(error){        
    }
    try{
        document.getElementById('main-content').classList.toggle('blur');
        document.getElementById('loader').classList.toggle('none-div');
        document.getElementById('loader').classList.toggle('loader-container');
    }
    catch(error){}
}
