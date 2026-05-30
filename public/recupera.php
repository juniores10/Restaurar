<?php session_start(); ?>
<!DOCTYPE html>
<html lang="pt_br">

<head>
     <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
     <meta name="description" content="Profsa Informática - Gerenciamento de Colaboradores" />
     <meta name="author" content="Paulo Rogério Souza" />
     <meta name="viewport" content="width=device-width, initial-scale=1" />

     <link href="https://fonts.googleapis.com/css?family=Lato:300,400" rel="stylesheet" type="text/css" />
     <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400" rel="stylesheet" type="text/css" />

     <link href="//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.css">

     <link rel="shortcut icon" href="https://www.profsa.com.br/pallas56/img/logo-00.png" />

     <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>

     <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/css/materialize.min.css">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.100.2/js/materialize.min.js"></script>

     <script src="https://cdn.jsdelivr.net/npm/sweetalert2@8/dist/sweetalert2.min.js"></script> 
     <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@8/dist/sweetalert2.min.css" id="theme-styles">

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>PegaNet - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     var alt = $(window).height();
     var lar = $(window).width();

     $("#env_e").click(function() {
          let ema = $('#ema_u').val();
          $.getJSON("ajax/recupera-ema.php", {
                    ema: ema
               })
               .done(function(data) {
                    if (data.men != "") {
                         swal.fire("E-Mail não Encontrado", data.men, "error");    
                    } else {
                         swal.fire("Senha Recuperada ...", "Senha enviada para seu e-mail informado !", "success");    
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no processamento de recuperação de login");
               });

     });

});
</script>

<?php     
     $ret = 0; $men = "";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     $_SESSION['wrkdatide'] = date ("d/m/Y H:i:s", getlastmod());

?>

<body class="log-1">
     <div class="login">
          <div class="qua-1 animated bounceInUp">
               <br />
               <div class="row">
                    <div class="col-md-12 text-center">
                         <img class="img-a" src="img/logo-01.png">
                    </div>
               </div>
               <form id="frmRecupera" name="frmRecupera" action="recupera.php" method="POST">
                    <div class="row">
                         <div class="col s1"></div>
                         <div class="input-field col s10">
                              <input type="email" class="center" id="ema_u" name="ema_u" maxlength="75" value="" required>
                              <label for="nome">Seu e-mail cadastrado ...</label>
                         </div>
                         <div class="col s1"></div>
                    </div>
                    <div class="row">
                         <input class="bot-1" type="button" id="env_e" name="env_e" value="Enviar" />
                         <br /><br />
                         <span class="tit-3"><a href="index.php">Voltar ao Login</a></span>
                    </div>
               </form>
          </div>
     </div>
</body>

</html>

