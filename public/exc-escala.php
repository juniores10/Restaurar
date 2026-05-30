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

     <script type="text/javascript" language="javascript"
          src="https://cdn.datatables.net/1.10.15/js/jquery.dataTables.min.js"></script>
     <link href="https://cdn.datatables.net/1.10.15/css/jquery.dataTables.min.css" rel="stylesheet" type="text/css" />

     <link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">
     <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>

     <script type="text/javascript" src="js/jquery.mask.min.js"></script>

     <script type="text/javascript" src="js/datepicker-pt-BR.js"></script>

     <link href="css/pallas56.css" rel="stylesheet" type="text/css" media="screen" />
     <title>Escala - Gerenciamento de Colaboradores</title>
</head>

<script>
var mar_e = 0;

$(function() {
     $("#dti").mask("00/00/0000");
     $("#dtf").mask("00/00/0000");
     $("#mes_p").mask("00/0000");
     $("#dti").datepicker($.datepicker.regional["pt-BR"]);
     $("#dtf").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {

     let ret = carrega_exc();

     $("#mar_e").click(function() {
          if (mar_e == 0) {
               $(".exc_e").prop("checked", true);
               mar_e = 1;
          } else {
               $(".exc_e").prop("checked", false);
               mar_e = 0;
          }
     });

     $("#loc_p").blur(function() {
          let ret = carrega_exc();
     });

     $("#set_p").blur(function() {
          let ret = carrega_exc();
     });

     $("#car_p").blur(function() {
          let ret = carrega_exc();
     });

     $("#fun_p").blur(function() {
          let ret = carrega_exc();
     });

     $("#mes_p").blur(function() {
          let ret = carrega_exc();
     });

     $("#exc_e").click(function() {
          $('.ima-4').css("display", "block");
          var dad = $('#frmTelMan').serialize();
          $.post("ajax/esc-exc-linhas.php", dad, function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         alert(data.avi);
                         $('#lis_e').html('');
                         $('.ima-4').css("display", "none");
                         $('#loc_p').val(0);
                         $('#set_p').val(0);
                         $('#car_p').val(0);
                         $('#fun_p').val(0);
                    }
               }, "json")
               .done(function() {

               }, "json")
               .fail(function(data) {
                    console.log(JSON.stringify(data));
                    alert("Erro ocorrido na gravação de dados do registro do colaborador !");
               }, "json");

     });

     $(window).scroll(function() {
          if ($(this).scrollTop() > 100) {
               $(".subir").fadeIn(500);
          } else {
               $(".subir").fadeOut(250);
          }
     });

     $(".subir").click(function() {
          $topo = $("#box00").offset().top;
          $('html, body').animate({
               scrollTop: $topo
          }, 1500);
     });

     function carrega_exc() {
          $('.ima-4').css("display", "block");
          $.getJSON("ajax/esc-exc-dados.php", {
                    tip: 1,
                    loc: $('#loc_p').val(),
                    set: $('#set_p').val(),
                    car: $('#car_p').val(),
                    fun: $('#fun_p').val(),
                    dat: $('#mes_p').val(),
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_e').html(data.txt);
                         let ret = carrega_tab();
                         $('.ima-4').css("display", "none");
                         $('#men-2').css('height', $('#men-3').height() + 'px');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de funcionários para escala");
               });
     }

     function carrega_tab() {
          $('#tab-0').DataTable({
               "pageLength": 50,
               "aaSorting": [
                    [4, 'asc'],
                    [1, 'asc'],
               ],
               "language": {
                    "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
                    "zeroRecords": "Não existe registros a demonstrar ...",
                    "info": "Mostrada página _PAGE_ de _PAGES_",
                    "infoEmpty": "Sem registros de escala ...",
                    "sSearch": "Buscar:",
                    "infoFiltered": "(Consulta de _TOTAL_/_MAX_ total de linhas)",
                    "oPaginate": {
                         sFirst: "Primeiro",
                         sLast: "Último",
                         sNext: "Próximo",
                         sPrevious: "Anterior"
                    }
               }
          });

     }
});
</script>

<?php
     $ret = 0; 
     include_once "dados.php";
     include_once "profsa.php";
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if (isset($_SESSION['wrkmesano']) == false) { 
          $_SESSION['wrkmesano'] = date('m/Y'); 
     } else if ($_SESSION['wrkmesano'] == "") {
          $_SESSION['wrkmesano'] = date('m/Y'); 
     }
 
?>

<body id="box00">
     <div class="container-fluid">
          <div class="row">
               <div id="men-2" class="cab-a col-md-2">
                    <?php include_once "cabecalho-2.php"; ?>
               </div>
               <div id="men-3" class="col-md-10">
                    <br />
                    <div class="row">
                         <div class="col-md-10">
                              <h3 class="cor-4"><strong>Exclusão de Escalas</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mar_e" href="#"
                                   title="Clicar neste ícone o usuário marca ou desmarca todas as escalas para eventual exclusão.">
                                   <i class="fa fa-check-square-o fa-2x" aria-hidden="true"></i><br />
                                   <span class="lit-9">Marcar</span>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="exc_e" href="#"
                                   title="Abre uma página para efetuar exclusão em grupo (várias) de escala de funcionários.">
                                   <i class="fa fa-trash fa-2x" aria-hidden="true"></i><br />
                                   <span class="lit-9">Excluir</span>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="exc-escala.php" method="POST">
                         <div class="qua-5">
                              <div class="row">
                                   <div class="col-md-1"></div>
                                   <div class="col-md-2">
                                        <label>Local</label>
                                        <select id="loc_p" name="loc_p" class="form-control">
                                             <?php $ret = carrega_loc(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Setor</label>
                                        <select id="set_p" name="set_p" class="form-control">
                                             <?php $ret = carrega_set(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Cargo</label>
                                        <select id="car_p" name="car_p" class="form-control">
                                             <?php $ret = carrega_car(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Função</label>
                                        <select id="fun_p" name="fun_p" class="form-control">
                                             <?php $ret = carrega_fun(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-2">
                                        <label>Mês e Ano</label>
                                        <input type="text" class="form-control text-center" maxlength="7" id="mes_p"
                                             name="mes_p" value="<?php echo $_SESSION['wrkmesano']; ?>" />
                                   </div>
                                   <div class="col-md-1"></div>
                              </div>
                              <br />
                         </div>
                         <br />
                         <div id="lis_e"></div>
                    </form>
               </div>
          </div>
          <div class="row">
               <img class="subir" src="img/subir.png" />
               <img class="ima-4" src="img/preloader-5.gif">
          </div>
     </div>
</body>

<?php
function carrega_loc() {
     $sta = 0;
     include_once "dados.php";    
     $loc = (isset($_REQUEST['loc']) == false ? "" : $_REQUEST['loc']);
     echo '<option value="0" selected="selected">Selecione local ...</option>';
     $com = "Select idlocal, locrazao from tb_local where locstatus = 0 order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          if ($lin['idlocal'] != $loc) {
               echo  '<option value ="' . $lin['idlocal'] . '">' . $lin['locrazao'] . '</option>'; 
          } else {
               echo  '<option value ="' . $lin['idlocal'] . '" selected="selected">' . $lin['locrazao'] . '</option>';
          }
     }
     return $sta;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione setor ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 2 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_car() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione cargo ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 3 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

function carrega_fun() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione função ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

?>

</html>