document.getElementById('id_nueva_imagen').addEventListener('change', function(e) {
    document.querySelector('.guardar-cambios-btn').classList.add('visible');
    
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('preview-imagen').src = event.target.result;
        };
        reader.readAsDataURL(e.target.files[0]);
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("darkModeToggle");
    
    toggle.checked = false;
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    
    const localStorageTheme = localStorage.getItem('darkMode');
    if (localStorageTheme !== null) {
        const isDark = localStorageTheme === 'true';
        toggle.checked = isDark;
        document.body.classList.toggle("dark", isDark);
        document.body.classList.toggle("light", !isDark);
    }
    
    fetch("/perfil/obtener-tema/")  
        .then(response => response.json())
        .then(data => {
            const isDark = data.theme === "dark";
            toggle.checked = isDark;
            document.body.classList.toggle("dark", isDark);
            document.body.classList.toggle("light", !isDark);
            localStorage.setItem('darkMode', isDark);
        })
        .catch(error => {
            console.error("Error al obtener tema:", error);
        });

    toggle.addEventListener("change", function () {
        const isDark = toggle.checked;
        
        document.body.classList.toggle("dark", isDark);
        document.body.classList.toggle("light", !isDark);
        
        localStorage.setItem('darkMode', isDark);
        
        fetch("/perfil/cambiar-tema/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ theme: isDark ? "dark" : "light" }),
        });
    });

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== "") {
            const cookies = document.cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + "=")) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
});