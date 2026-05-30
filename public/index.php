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

     $("#ent_s").click(function() {
          let ema = $('#ema_u').val();
          let ace = $('#sen_a').val();
          $.getJSON("ajax/acessar-ema.php", {
                    ema: ema,
                    ace: ace
               })
               .done(function(data) {
                    if (data.men != "") {
                         swal.fire("Login Inválido", data.men, "error");    
                    } else {
                         if (data.tip == 2) {
                              location.href = "menu02.php"
                         } else {
                              location.href = "menu03.php"
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no processamento de acesso ao login");
               });
     });

});
</script>

<?php     
     $ret = 0; $men = "";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkdirsis'] = __DIR__;
     $_SESSION['wrknompro'] = __FILE__;
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     $_SESSION['wrkdatide'] = date ("d/m/Y H:i:s", getlastmod());
     $_SESSION['wrknomide'] = get_current_user();
     $_SESSION['wrknumusu'] = getmypid();

?>

<body class="log-1">
     <div class="login">
          <div class="qua-1 animated bounceInDown">
               <br />
               <div class="row">
                    <div class="col-md-12 text-center">
                         <img class="ima-6" src="img/logo-01.jpg">
                    </div>
               </div>
               <form id="frmLogin" name="frmLogin" action="index.php" method="POST">
                    <div class="row">
                         <div class="col s1"></div>
                         <div class="col s1"><br />
                              <i class="cor-4 fa fa-envelope fa-2x" aria-hidden="true"></i>
                         </div>
                         <div class="input-field col s9">
                              <input type="email" class="center" id="ema_u" name="ema_u" maxlength="75" value="" required>
                              <label for="nome">Seu e-mail para acesso ...</label>
                         </div>
                         <div class="col s1"></div>
                    </div>
                    <div class="row">
                         <div class="col s1"></div>
                         <div class="col s1"><br />
                              <i class="cor-4 fa fa-lock fa-2x" aria-hidden="true"></i>
                         </div>
                         <div class="input-field col s9">
                              <input type="password" class="center" id="sen_a" name="sen_a" maxlength="15" value=""
                                   required>
                              <label for="senha">Sua senha para entrada ...</label>
                         </div>
                         <div class="col s1"></div>
                    </div>
                    <div class="row">
                         <input class="bot-5" type="button" id="ent_s" name="ent_s" value="Entrar" />
                         <br /><br />
                         <input type="checkbox" id="lem_l" name="lem_l" value="S" />
                         <label class="tit-1" for="lem">Lembrar Login</label>
                         <br /><br />
                         <span class="cor-4 tit-3"><a href="recupera.php">Esqueci a senha</a></span>
                    </div>
                    <img class="ima-5" src="img/logo-09.png">
               </form>
          </div>
     </div>
</body>

</html>

