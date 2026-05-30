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

     <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"
          integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous">
     </script>
     <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"
          integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous">
     </script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Saída - Gerenciamento de Colaboradores</title>
</head>

<script>
$(document).ready(function() {
     var alt = $(window).height();
     var lar = $(window).width();

     localStorage.removeItem('fun_t');
     localStorage.removeItem('ban_t');

});
</script>

<?php
     $sta = 00;
     $ret = 00;
     include_once "dados.php";
     include_once "profsa.php";
     date_default_timezone_set("America/Sao_Paulo");
     if (isset($_SESSION['wrknomusu']) == false) { $_SESSION['wrknomusu'] = ''; }
     if (isset($_SESSION['wrknompro']) == false) { $_SESSION['wrknompro'] = ''; }
     if (isset($_SESSION['wrkemausu']) == false) { $_SESSION['wrkemausu'] = ''; }
     $nom = $_SESSION['wrknomusu'];
     $ema = $_SESSION['wrkemausu'];
     if (isset($_SERVER['HTTP_REFERER']) == true) {
     if (limpa_pro($_SESSION['wrknompro']) != limpa_pro($_SERVER['HTTP_REFERER'])) {
          $_SESSION['wrkproant'] = limpa_pro($_SERVER['HTTP_REFERER']);
          $ret = gravar_log(99, "Saída na página de menu principal do sistema Pallas.56 - Análise de Impostos");  
     }}

     if ($nom == "") { $nom = substr(get_current_user(), 0, 99); }
     $_SESSION['wrkcodreg'] = 0; $_SESSION['wrkopereg'] = 0; $_SESSION['wrktipusu'] = 0;  $_SESSION['wrkideusu'] = 0; 
     $_SESSION['wrknomusu'] = ""; $_SESSION['wrkemausu'] =""; $_SESSION['wrktipban'] =""; $_SESSION['wrkmosavi'] = 0; $_SESSION['wrkmenavi'] = ''; 
     session_destroy();  
     $sem_c = date("w");
     if ($sem_c == 0) { $hoj_c = 'Domingo '; }
     if ($sem_c == 1) { $hoj_c = 'Segunda-feira  - '; }
     if ($sem_c == 2) { $hoj_c = 'Terça-feira  - '; }
     if ($sem_c == 3) { $hoj_c = 'Quarta-feira  - '; }
     if ($sem_c == 4) { $hoj_c = 'Quinta-feira  - '; }
     if ($sem_c == 5) { $hoj_c = 'Sexta-feira  - '; }
     if ($sem_c == 6) { $hoj_c = 'Sábado  - '; }
     $hoj_c = $hoj_c . date('d/m/Y H:i:s') . ' hs';
?>


<body class="sai-0">
     <div id="particles-js" class="text-center">
          <br />
          <div class="row sai-1 animated zoomInUp">
               <div class="col-md-2">
                    <a href="index.php">
                         <img class="img-fluid" src="img/logo-01.png">
                    </a>
               </div>
               <div class="col-md-8">
                    <h2><strong>PEGANET PROVEDOR DE INTERNET</strong></h2>
                    <h3><strong>Obrigado por utilizar o sistema de Gerenciamento de Colaboradores</strong></h3>
                    <br />
                    <h4><strong><?php echo $nom; ?></strong></h4>
                    <h5><strong><?php echo $ema; ?></strong></h5>
                    <h5><?php echo $hoj_c; ?></h5>
               </div>
               <div class="col-md-2"></div>
          </div>
     </div>

     <script type="text/javascript" src="js/particles.js"></script>
     <script type="text/javascript" src="js/app.js"></script>

     <script>
     particlesJS.load('particles-js', 'particlesjs-config.json');
     </script>
</body>

</html>