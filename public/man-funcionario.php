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
     <title>Funcionários - Gerenciamento de Colaboradores</title>
</head>

<script>
$(function() {
     $("#hor").mask("000");
     $("#car_0").mask("00");
     $("#car_1").mask("00");
     $("#car_2").mask("00");
     $("#car_3").mask("00");
     $("#car_4").mask("00");
     $("#car_5").mask("00");
     $("#car_6").mask("00");
     $("#cpf").mask("000.000.000-00");
     $("#nas").mask("00/00/0000");
     $("#sem_0").mask("00:00-00:00");
     $("#sem_1").mask("00:00-00:00");
     $("#sem_2").mask("00:00-00:00");
     $("#sem_3").mask("00:00-00:00");
     $("#sem_4").mask("00:00-00:00");
     $("#sem_5").mask("00:00-00:00");
     $("#sem_6").mask("00:00-00:00");
     $("#sal_i").mask("0000:00", {
          reverse: true
     });
     $("#nas").datepicker($.datepicker.regional["pt-BR"]);
});

$(document).ready(function() {
     if (localStorage.fun_t == undefined) {
          $('#tel_c').hide();
          localStorage.setItem('fun_t', 1);
     }

     $('#tab-0').DataTable({
          "pageLength": 50,
          "aaSorting": [
               [3, 'asc'],
               [4, 'asc']
          ],
          "language": {
               "lengthMenu": "Demonstrar _MENU_ linhas por páginas",
               "zeroRecords": "Não existe registros a demonstrar ...",
               "info": "Mostrada página _PAGE_ de _PAGES_",
               "infoEmpty": "Sem registros de funcionários ...",
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

     $('#men-2').css('height', $('#men-3').height() + 'px');

     $("#mos_t").click(function() {
          $('#tel_c').fadeToggle();
          $('#men-2').css('height', $('#men-3').height() + 'px');
     });

     $("#sal_f").click(function() {
          let erro = 0;
          var ope = $('#ope_f').val();
          var cod = $('#cod_f').val();
          if (ope == 3) {
               let ret = confirm('Confirma exclusão de funcionário informada em tela ?');
               if (ret == true) {
                    $.getJSON("ajax/fun-del-dados.php", {
                              ope: ope,
                              cod: cod
                         })
                         .done(function(data) {
                              if (data.men != "") {
                                   alert(data.men);
                              } else {
                                   $('#nom').val('');
                                   $('#mat').val('');
                                   $('#cpf').val('');
                                   $('#sen').val('');
                                   $('#hor').val('');
                                   $('#ema').val('');
                                   $('#sal_i').val('');
                                   $('#car_0').val('');
                                   $('#car_1').val('');
                                   $('#car_2').val('');
                                   $('#car_3').val('');
                                   $('#car_4').val('');
                                   $('#car_5').val('');
                                   $('#car_6').val('');
                                   $('#sem_0').val('');
                                   $('#sem_1').val('');
                                   $('#sem_2').val('');
                                   $('#sem_3').val('');
                                   $('#sem_4').val('');
                                   $('#sem_5').val('');
                                   $('#sem_6').val('');
                                   $('#nas').val('');
                                   $('#sta').val(0);
                                   $('#set').val(0);
                                   $('#loc').val(0);
                                   $('#car').val(0);
                                   $('#fun').val(0);
                                   $('#obs').val('');
                                   localStorage.removeItem('fun_t');
                                   $('#frmTelMan').submit();
                              }
                         }).fail(function(data) {
                              console.log('Erro: ' + JSON.stringify(data));
                              alert("Erro ocorrido na exclusão dados do funcionário");
                         });
               }
          }
          if ($('#nom').val() == "") {
               alert("Nome do funcionário não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#mat').val() == "") {
               alert("Número de Matrícula não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#cpf').val() == "") {
               alert("Número do Cpf não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#sen').val() == "") {
               alert("Senha de Acesso não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#hor').val() == "") {
               alert("Carga Horária não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#ema').val() == "") {
               alert("E-Mail do funcionário não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#sem_1').val() == "") {
               alert("Horário Diário do funcionário não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if ($('#loc').val() == "0") {
               alert("Local de trabalho não pode ficar em branco no cadastro !");
               erro = 1;
          }
          if (ope <= 2 && erro == 0) {
               var dad = $('#frmTelMan').serialize();
               $.post("ajax/fun-gra-dados.php", dad, function(data) {
                         if (data.men != "") {
                              alert(data.men);
                         } else {
                              $('#nom').val('');
                              $('#mat').val('');
                              $('#cpf').val('');
                              $('#sen').val('');
                              $('#hor').val('');
                              $('#ema').val('');
                              $('#sal_i').val('');
                              $('#car_0').val('');
                              $('#car_1').val('');
                              $('#car_2').val('');
                              $('#car_3').val('');
                              $('#car_4').val('');
                              $('#car_5').val('');
                              $('#car_6').val('');
                              $('#sem_0').val('');
                              $('#sem_1').val('');
                              $('#sem_2').val('');
                              $('#sem_3').val('');
                              $('#sem_4').val('');
                              $('#sem_5').val('');
                              $('#sem_6').val('');
                              $('#nas').val('');
                              $('#sta').val(0);
                              $('#set').val(0);
                              $('#loc').val(0);
                              $('#car').val(0);
                              $('#fun').val(0);
                              $('#obs').val('');
                              localStorage.removeItem('fun_t');
                              $('#frmTelMan').submit();
                         }
                    }, "json")
                    .done(function(data) {

                    }, "json")
                    .fail(function(data) {
                         console.log(JSON.stringify(data));
                         alert(
                              "Erro ocorrido na gravação de dados do registro do funcionário !"
                         );
                    }, "json");
          }
     });

     $("form").on("click", ".func", function() {
          $('#tel_c').fadeIn();
          var ope = $(this).attr("ope");
          var cod = $(this).attr("cod");
          $('#ope_f').val(ope);
          $('#cod_f').val(cod);
          $.getJSON("ajax/fun-car-dados.php", {
                    ope: ope,
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#cod').val(data.cod);
                         $('#nom').val(data.nom);
                         $('#mat').val(data.mat);
                         $('#cpf').val(data.cpf);
                         $('#sen').val(data.sen);
                         $('#hor').val(data.hor);
                         $('#ema').val(data.ema);
                         $('#sal_i').val(data.sal_i);
                         $('#car_0').val(data.car_0);
                         $('#car_1').val(data.car_1);
                         $('#car_2').val(data.car_2);
                         $('#car_3').val(data.car_3);
                         $('#car_4').val(data.car_4);
                         $('#car_5').val(data.car_5);
                         $('#car_6').val(data.car_6);
                         $('#sem_0').val(data.sem_0);
                         $('#sem_1').val(data.sem_1);
                         $('#sem_2').val(data.sem_2);
                         $('#sem_3').val(data.sem_3);
                         $('#sem_4').val(data.sem_4);
                         $('#sem_5').val(data.sem_5);
                         $('#sem_6').val(data.sem_6);
                         $('#nas').val(data.nas);
                         $('#sta').val(data.sta);
                         $('#set').val(data.set);
                         $('#loc').val(data.loc);
                         $('#car').val(data.car);
                         $('#fun').val(data.fun);
                         $('#obs').val(data.obs);
                         $('#ima').attr('src', data.fot);
                         $('#sal_f').text('Salvar');
                         if (ope == 3) {
                              $('#sal_f').text('Deletar');
                         }
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do funcionário");
               });
     });

     $('#car_f').bind("click", function() {
          $('#doc_j').click();
     });

     $('#doc_j').change(function() {
          var cam = $('#doc_j').val();
          fot_f = new FormData();
          fot_f.append('arq-fot', $('#doc_j').prop('files')[0]);
          $.ajax({
               url: 'ajax/fun-fot-funcionario.php?cam=' + cam,
               data: fot_f,
               dataType: 'json',
               processData: false,
               contentType: false,
               type: 'POST',
               success: function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#ima').attr('src', data.fot);
                    }
               },
               error: function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert(
                         "Erro ocorrido no processamento de Upload de foto de funcionário"
                    );
               }
          });
     });

     $("form").on("click", ".foto", function() {
          var cam = $(this).attr("cam");
          $('#fot-f').attr('src', cam);
          $('#fot-fun').modal('show');
     });

     $("form").on("click", ".ass_f", function() {
          var cam = $(this).attr("cam");
          var cod = $(this).attr("cod");
          $('#cod_f').val(cod);
          $('#ass-f').attr('src', cam);
          $('#dad-ass').modal('show');
     });

     $("form").on("click", ".doc_f", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/men-car-doctos.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#lis_d').html(data.txt);
                         $('#tel-doc').text('Documentos do Funcionário - ' + data.nom);
                         $('#dad-doc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do banco de horas");
               });
     });

     $("form").on("click", ".ban_h", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/men-car-banco.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-ban').text(data.tit);
                         $('#dad-b').html(data.txt);
                         $('#sal-h').text('Saldo de Horas: ' + data.sal);
                         $('#sal-h').addClass(data.cor);
                         $('#dad-ban').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados do banco de horas");
               });
     });

     $("form").on("click", ".esc_d", function() {
          var cod = $(this).attr("cod");
          $.getJSON("ajax/men-car-escala.php", {
                    cod: cod
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#tel-esc').text(data.tit);
                         $('#dad-e').html(data.txt);
                         $('#dad-esc').modal('show');
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no carregamento de dados da escala de horas");
               });
     });

     $("#pes_f").click(function() {
          $('#frmTelMan').submit();
     });

     $("#sem_1").blur(function() {
          if ($('#sem_1').val() == "") {
               $('#sem_1').val($('#sem_0').val());
          }
     });

     $("#sem_2").blur(function() {
          if ($('#sem_2').val() == "") {
               $('#sem_2').val($('#sem_1').val());
          }
     });
     $("#sem_3").blur(function() {
          if ($('#sem_3').val() == "") {
               $('#sem_3').val($('#sem_2').val());
          }
     });
     $("#sem_4").blur(function() {
          if ($('#sem_4').val() == "") {
               $('#sem_4').val($('#sem_3').val());
          }
     });
     $("#sem_5").blur(function() {
          if ($('#sem_5').val() == "") {
               $('#sem_5').val($('#sem_4').val());
          }
     });

     $("#apr_a").click(function() {
          $.getJSON("ajax/fun-ass-atualiza.php", {
                    tip: 3,
                    cod: $('#cod_f').val(),
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#frmTelMan').submit();
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no processameto da assinatura do funcionário");
               });
     });

     $("#rep_a").click(function() {
          $.getJSON("ajax/fun-ass-atualiza.php", {
                    tip: 2,
                    cod: $('#cod_f').val(),
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#frmTelMan').submit();
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido no processameto da assinatura do funcionário");
               });
     });

     $('#sal_i').on('keydown', function(e) {
          let val = $(this).val();
          if ((e.key === '-' || e.key === '+') && val.indexOf('-') === -1 && val.indexOf('+') === -1) {
               e.preventDefault();
               $(this).val(e.key + val);
          }
     });

     $("form").on("click", ".del_d", function() {
          var nom = $(this).attr("nom");
          let ret = confirm('Confirma exclusão de documento do funcionário ?');
          if (ret == true) {
               $.getJSON("ajax/fun-del-docto.php", {
                    nom: nom
               })
               .done(function(data) {
                    if (data.men != "") {
                         alert(data.men);
                    } else {
                         $('#frmTelMan').submit();
                    }
               }).fail(function(data) {
                    console.log('Erro: ' + JSON.stringify(data));
                    alert("Erro ocorrido na exclusão de documento do funcionário");
               });
          }
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

});
</script>

<?php
     $ret = 0; 
     $per = "";
     $del = "";
     $bot = "Salvar";
     include_once "dados.php";
     include_once "profsa.php";
     $_SESSION['wrkendser'] = getenv("REMOTE_ADDR");
     date_default_timezone_set("America/Sao_Paulo");

     if (isset($_SESSION['wrkopereg']) == false) { $_SESSION['wrkopereg'] = 0; }
     if (isset($_SESSION['wrkcodreg']) == false) { $_SESSION['wrkcodreg'] = 0; }
     if (isset($_REQUEST['ope']) == true) { $_SESSION['wrkopereg'] = $_REQUEST['ope']; }
     if (isset($_REQUEST['cod']) == true) { $_SESSION['wrkcodreg'] = $_REQUEST['cod']; }

     if ($_SESSION['wrkopereg'] == 1) { 
          $_SESSION['wrkcodreg'] = ultimo_cod();
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
                              <h3 class="cor-4"><strong>Manutenção de Funcionários</strong></h3>
                         </div>
                         <div class="col-md-1 text-center">
                              <a id="mos_t" href="#"
                                   title="Mostra e esconde a página detalhada com os dados de funcionários para edição.">
                                   <i class="fa fa-eye fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                         <div class="col-md-1 text-center">
                              <a href="man-funcionario.php?ope=1&cod=0"
                                   title="Abre página para adicionar (criar) mais um funcionário dentro do sistema.">
                                   <i class="fa fa-plus-circle fa-2x" aria-hidden="true"></i>
                              </a>
                         </div>
                    </div>
                    <br />
                    <form id="frmTelMan" name="frmTelMan" action="man-funcionario.php" method="POST"
                         enctype="multipart/form-data">
                         <div id="tel_c" class="qua-2">
                              <div class="row">
                                   <div class="col-md-2">
                                        <label>Código</label>
                                        <input type="text" class="form-control text-center" maxlength="6" id="cod"
                                             name="cod" value="<?php echo $_SESSION['wrkcodreg']; ?>" disabled />
                                   </div>
                                   <div class="col-md-8">
                                        <label>Nome do Funcionário</label>
                                        <input type="text" class="form-control" maxlength="75" id="nom" name="nom"
                                             value="<?php echo (isset($_REQUEST['nom']) == false ? "" : $_REQUEST['nom']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Status</label>
                                        <select id="sta" name="sta" class="form-control">
                                             <option value="0"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 0 ? '' : 'selected="selected"'); ?>>
                                                  Ativo
                                             </option>
                                             <option value="1"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 1 ? '' : 'selected="selected"'); ?>>
                                                  Férias</option>
                                             <option value="2"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 2 ? '' : 'selected="selected"'); ?>>
                                                  Suspenso</option>
                                             <option value="3"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 3 ? '' : 'selected="selected"'); ?>>
                                                  Afastado</option>
                                             <option value="4"
                                                  <?php echo ((isset($_REQUEST['sta']) == false ? 0 : $_REQUEST['sta']) != 4 ? '' : 'selected="selected"'); ?>>
                                                  Desligado</option>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-2 text-center">
                                        <img id="ima" src="img/imagem-1.png" class="ima-2 img-fluid" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Matrícula</label>
                                        <input type="text" class="form-control" maxlength="10" id="mat" name="mat"
                                             value="<?php echo (isset($_REQUEST['mat']) == false ? "" : $_REQUEST['mat']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Número do CPF</label>
                                        <input type="text" class="form-control" maxlength="14" id="cpf" name="cpf"
                                             value="<?php echo (isset($_REQUEST['cpf']) == false ? "" : $_REQUEST['cpf']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Nascimento</label>
                                        <input type="text" class="form-control text-center" maxlength="10" id="nas"
                                             name="nas"
                                             value="<?php echo (isset($_REQUEST['nas']) == false ? "" : $_REQUEST['nas']); ?>" />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Senha Acesso</label>
                                        <input type="text" class="form-control" maxlength="10" id="sen" name="sen"
                                             value="<?php echo (isset($_REQUEST['sen']) == false ? "" : $_REQUEST['sen']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Carga Horária Mensal</label>
                                        <input type="text" class="form-control" maxlength="3" id="hor" name="hor"
                                             value="<?php echo (isset($_REQUEST['hor']) == false ? "" : $_REQUEST['hor']); ?>"
                                             required />
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-3">
                                        <label>Local</label>
                                        <select id="loc" name="loc" class="form-control">
                                             <?php $ret = carrega_loc(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Setor</label>
                                        <select id="set" name="set" class="form-control">
                                             <?php $ret = carrega_set(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Cargo</label>
                                        <select id="car" name="car" class="form-control">
                                             <?php $ret = carrega_car(); ?>
                                        </select>
                                   </div>
                                   <div class="col-md-3">
                                        <label>Função</label>
                                        <select id="fun" name="fun" class="form-control">
                                             <?php $ret = carrega_fun(); ?>
                                        </select>
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-10">
                                        <label>E-Mail</label>
                                        <input type="text" class="form-control" maxlength="75" id="ema" name="ema"
                                             value="<?php echo (isset($_REQUEST['ema']) == false ? "" : $_REQUEST['ema']); ?>"
                                             required />
                                   </div>
                                   <div class="col-md-2">
                                        <label>Saldo Inicial</label>
                                        <input type="text" class="form-control text-center" maxlength="3" id="sal_i" name="sal_i"
                                             value="<?php echo (isset($_REQUEST['sal_i']) == false ? "" : $_REQUEST['sal_i']); ?>"
                                             required />
                                   </div>
                              </div>
                              <div class="gru-1">
                                   <div class="gru-2">
                                        <label>Carga Horária - Domingo</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_0" name="car_0"
                                             value="<?php echo (isset($_REQUEST['car_0']) == false ? "" : $_REQUEST['car_0']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Segunda</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_1" name="car_1"
                                             value="<?php echo (isset($_REQUEST['car_1']) == false ? "" : $_REQUEST['car_1']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Terça</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_2" name="car_2"
                                             value="<?php echo (isset($_REQUEST['car_2']) == false ? "" : $_REQUEST['car_2']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Quarta</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_3" name="car_3"
                                             value="<?php echo (isset($_REQUEST['car_3']) == false ? "" : $_REQUEST['car_3']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Quinta</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_4" name="car_4"
                                             value="<?php echo (isset($_REQUEST['car_4']) == false ? "" : $_REQUEST['car_4']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Sexta</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_5" name="car_5"
                                             value="<?php echo (isset($_REQUEST['car_5']) == false ? "" : $_REQUEST['car_5']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Sábado</label>
                                        <input type="text" class="cpo-1" maxlength="2" id="car_6" name="car_6"
                                             value="<?php echo (isset($_REQUEST['car_6']) == false ? "" : $_REQUEST['car_6']); ?>"
                                             required />
                                   </div>
                              </div>
                              <div class="gru-1">
                                   <div class="gru-2">
                                        <label>Horário - Domingo</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_0" name="sem_0"
                                             value="<?php echo (isset($_REQUEST['sem_0']) == false ? "" : $_REQUEST['sem_0']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Segunda</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_1" name="sem_1"
                                             value="<?php echo (isset($_REQUEST['sem_1']) == false ? "" : $_REQUEST['sem_1']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Terça</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_2" name="sem_2"
                                             value="<?php echo (isset($_REQUEST['sem_2']) == false ? "" : $_REQUEST['sem_2']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Quarta</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_3" name="sem_3"
                                             value="<?php echo (isset($_REQUEST['sem_3']) == false ? "" : $_REQUEST['sem_3']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Quinta</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_4" name="sem_4"
                                             value="<?php echo (isset($_REQUEST['sem_4']) == false ? "" : $_REQUEST['sem_4']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Sexta</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_5" name="sem_5"
                                             value="<?php echo (isset($_REQUEST['sem_5']) == false ? "" : $_REQUEST['sem_5']); ?>"
                                             required />
                                   </div>
                                   <div class="gru-2">
                                        <label>Sábado</label>
                                        <input type="text" class="cpo-1" maxlength="11" id="sem_6" name="sem_6"
                                             value="<?php echo (isset($_REQUEST['sem_6']) == false ? "" : $_REQUEST['sem_6']); ?>"
                                             required />
                                   </div>
                              </div>
                              <div class="row">
                                   <div class="col-md-12">
                                        <label>Observação</label>
                                        <textarea class="form-control" rows="3" id="obs"
                                             name="obs"><?php echo (isset($_REQUEST['obs']) == false ? "" : $_REQUEST['obs']); ?></textarea>
                                   </div>
                              </div>
                              <br />
                              <div class="row text-center">
                                   <div class="col-md-5"></div>
                                   <div class="col-md-2">
                                        <button type="button" id="sal_f" name="sal_f" <?php echo $per; ?>
                                             class="bot-1 <?php echo $del; ?>"><?php echo $bot; ?></button>
                                   </div>
                                   <div class="col-md-4"></div>
                                   <div class="col-md-1">
                                        <i id="car_f" class="cur-1 fa fa-id-badge fa-3x" aria-hidden="true"
                                             title="Abre janela para carrega foto do funcionário."></i>
                                   </div>
                              </div>
                         </div>
                         <br />
                         <div class="row qua-4">
                              <div class="col-md-2"></div>
                              <div class="col-md-4">
                                   <label>Setor</label>
                                   <select id="set_p" name="set_p" class="form-control">
                                        <?php $ret = carrega_set(); ?>
                                   </select>
                              </div>
                              <div class="col-md-4">
                                   <label>Função</label>
                                   <select id="fun_p" name="fun_p" class="form-control">
                                        <?php $ret = carrega_fun(); ?>
                                   </select>
                              </div>
                              <div class="col-md-2 text-right"><br />
                                   <button type="button" class="bot-2" id="pes_f" name="pes_f">
                                        <i class="fa fa-search fa-3x" aria-hidden="true"></i>
                                   </button>
                              </div>
                         </div>
                         <hr />
                         <div class="container-fluid">
                              <div class="row">
                                   <div class="tab-1 table-responsive">
                                        <table id="tab-0" class="table table-sm table-striped">
                                             <thead>
                                                  <tr>
                                                       <th width="2%" class="text-center">Alterar</th>
                                                       <th width="2%" class="text-center">Excluir</th>
                                                       <th>Status</th>
                                                       <th>Nome do Funcionário</th>
                                                       <th>Matrícula</th>
                                                       <th class="text-center">Aniversário</th>
                                                       <th>Numero CPF</th>
                                                       <th>Carga</th>
                                                       <th>Horário</th>
                                                       <th>E-Mail</th>
                                                       <th>Foto</th>
                                                       <th>Assinatura</th>
                                                       <th>Doctos</th>
                                                       <th>Banco</th>
                                                       <th>Escala</th>
                                                  </tr>
                                             </thead>
                                             <tbody>
                                                  <?php $ret = carrega_col();  ?>
                                             </tbody>
                                        </table>
                                   </div>
                              </div>
                         </div>
                         <input type="hidden" id="ope_f" value="0" />
                         <input type="hidden" id="cod_f" value="0" />
                         <input type="file" id="doc_j" class="bot-3" accept=".jpg, .png, .jpeg" />
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="fot-fun" tabindex="-1" role="dialog" aria-labelledby="tel-fot" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosFot" name="frmMosFot" action="man-funcionario.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-fot">Demonstração de Foto do Funcionário</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <img id="fot-f" class="img-fluid" src="" />
                                        </div>
                                   </div>
                                   <br />
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="clo" name="close" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-ban" tabindex="-1" role="dialog" aria-labelledby="tel-ban" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosFot" name="frmMosFot" action="man-funcionario.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-ban">Demonstração de Banco de Horas</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row text-center">
                                        <div class="col-md-12">
                                             <div id="dad-b"></div>
                                        </div>
                                   </div>
                                   <br />
                                   <div class="form-row">
                                        <div class="col-md-12 text-center">
                                             <strong>
                                                  <h3>
                                                       <div id="sal-h"></div>
                                                  </h3>
                                             </strong>
                                        </div>
                                   </div>
                                   <br />
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-esc" tabindex="-1" role="dialog" aria-labelledby="tel-esc" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosEsc" name="frmMosEsc" action="man-funcionario.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-esc">Demonstração de Escala de Trabalho</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row">
                                        <div class="col-md-12">
                                             <div id="dad-e"></div>
                                        </div>
                                   </div>
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-ass" tabindex="-1" role="dialog" aria-labelledby="tel-ass" aria-hidden="true"
               data-backdrop="static">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosAss" name="frmMosAss" action="man-funcionario.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-ass">Assinatura do Funcionário</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row">
                                        <div class="col-md-12 text-center">
                                             <img id="ass-f" class="img-fluid" src="" />
                                        </div>
                                   </div>
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="apr_a" name="apr_a"
                                        class="btn btn-outline-success">Aprovar</button>
                                   <button type="button" id="rep_a" name="rep_a"
                                        class="btn btn-outline-danger">Reprovar</button>
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-dark"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="modal fade" id="dad-doc" tabindex="-1" role="dialog" aria-labelledby="tel-doc" aria-hidden="true"
               data-backdrop="true">
               <div class="modal-dialog modal-lg" role="document">
                    <!-- modal-sm modal-lg modal-xl -->
                    <form id="frmMosDoc" name="frmMosDoc" action="man-funcionario.php" method="POST">
                         <div class="modal-content">
                              <div class="modal-header bg-primary text-white">
                                   <h5 class="modal-title" id="tel-doc">Documentos do Funcionário</h5>
                                   <button type="button" class="close" data-dismiss="modal" aria-label="Fechar">
                                        <span aria-hidden="true">&times;</span>
                                   </button>
                              </div>
                              <div class="modal-body">
                                   <div class="form-row">
                                        <div class="col-md-12">
                                             <div id="lis_d"></div>
                                        </div>
                                   </div>
                              </div>
                              <div class="modal-footer">
                                   <button type="button" id="fec_b" name="fec_b" class="btn btn-outline-danger"
                                        data-dismiss="modal">Fechar</button>
                              </div>
                         </div>
                    </form>
               </div>
          </div>
          <!------------------------------------------------------------------------------------------------------------------------------------------------------>
          <div class="row">
               <img class="subir" src="img/subir.png" />
          </div>
     </div>
</body>
<?php
function ultimo_cod() {
     $cod = 1;
     include_once "dados.php";
     $nro = acessa_reg('Select idfuncionario from tb_funcionario order by idfuncionario desc Limit 1', $reg);
     if ($nro == 1) {
          $cod = $reg['idfuncionario'] + 1;
     }        
     return $cod;
}

function carrega_col() {
     $ret = 0;
     include_once "dados.php";
     $com = "Select * from tb_funcionario where idfuncionario > 0 ";
     if (isset($_REQUEST['set_p']) == true) {
          if ($_REQUEST['set_p'] != 0) { $com .= " and funsetor = " . $_REQUEST['set_p']; }
     }
     if (isset($_REQUEST['fun_p']) == true) {
          if ($_REQUEST['fun_p'] != 0) { $com .= " and funfuncao = " . $_REQUEST['fun_p']; }
     }
     $com .= " order by funnome, idfuncionario";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          $txt =  '<tr>';
          $txt .= '<td class="text-center"><a class="func" href="#" ope=2 cod=' . $lin['idfuncionario'] . ' title="Efetua alteração do registro informado na linha"><i class="large material-icons">healing</i></a></td>';
          $txt .= '<td class="text-center"><a class="func" href="#" ope=3 cod=' . $lin['idfuncionario'] . ' title="Efetua alteração do registro informado na linha"><i class="cor-1 large material-icons">delete_forever</i></a></td>';
          if ($lin['funstatus'] == 0) {$txt .= "<td>" . "" . "</td>";}
          if ($lin['funstatus'] == 1) {$txt .= "<td>" . "Férias" . "</td>";}
          if ($lin['funstatus'] == 2) {$txt .= "<td>" . "Suspenso" . "</td>";}
          if ($lin['funstatus'] == 3) {$txt .= "<td>" . "Afastado" . "</td>";}
          if ($lin['funstatus'] == 4) {$txt .= "<td>" . "Desligado" . "</td>";}
          $txt .= '<td>' . $lin['funnome'] . '</td>';
          $txt .= '<td>' . $lin['funmatricula'] . '</td>';
          if ($lin['funnascimento']  == null) {
               $txt .= '<td>' . '' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . date('d', strtotime($lin['funnascimento'])) . "/" . mes_ano($lin['funnascimento']) . '</td>';
          }
          $txt .= '<td>' . mascara_cpo($lin['funnumerocpf'], "   .   .   -  ") . '</td>';
          $txt .= '<td>' . $lin['funcarga'] . '</td>';
          $txt .= '<td>' . $lin['funhora1'] . ':' . $lin['funhora2'] . '-' . $lin['funhora3'] . ':' . $lin['funhora4'] . '</td>';
          $txt .= '<td>' . $lin['funemail'] . '</td>';
          $cam = existe_fot($lin['idfuncionario']);
          if ($cam == "") {
               $txt .= '<td class="text-center">' . '<i class="cur-2 fa fa-address-book-o fa-3x" aria-hidden="true"></i>' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . '<img class="foto cur-1 ima-3" src=' . $cam . ' cam=' . $cam . ' />' . '</td>';
          }
          $cam = existe_ass($lin['idfuncionario']);
          if ($lin['funopcaoass'] == 0) {
               $txt .= '<td class="text-center">' . '<i class="cor-6 fa fa-pencil-square-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . ' title="Assinatura não carregada." cam=' . $cam . '></i>' . '</td>';
          }
          if ($lin['funopcaoass'] == 1) {
               $txt .= '<td class="text-center">' . '<i class="ass_f cur-1 cor-2 fa fa-pencil-square-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . ' title="Assinatura a ser verificada." cam=' . $cam . '></i>' . '</td>';
          }
          if ($lin['funopcaoass'] == 2) {
               $txt .= '<td class="text-center">' . '<i class="ass_f cur-1 cor-1 fa fa-pencil-square-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . ' title="Assinatura reprovada." cam=' . $cam . '></i>' . '</td>';
          }
          if ($lin['funopcaoass'] == 3) {
               $txt .= '<td class="text-center">' . '<i class="ass_f cur-1 cor-3 fa fa-pencil-square-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . ' title="Assinatura aprovada." cam=' . $cam . '></i>' . '</td>';
          }
          $qtd = existe_dct($lin['idfuncionario']);
          if ($qtd == 0) {
               $txt .= '<td class="text-center">' . '<i class="fa fa-file-o fa-3x" aria-hidden="true"></i>' . '</td>';
          } else {
               $txt .= '<td class="text-center">' . '<a class="doc_f" href="#" cod=' . $lin['idfuncionario'] . '>' . '<i class="fa fa-file-text-o fa-3x" aria-hidden="true"></i>' . '</a></td>';
          }
          $txt .= '<td class="text-center">' . '<i class="ban_h cur-1 cor-4 fa fa-clock-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . '></i>' . '</td>';
          $txt .= '<td class="text-center">' . '<i class="esc_d cur-1 cor-4 fa fa-calendar-check-o fa-3x" aria-hidden="true" cod=' . $lin['idfuncionario'] . '></i>' . '</td>';
          $txt .= "</tr>";
          echo $txt;
     }
     return $ret;
}

function carrega_loc() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione local desejado ...</option>';
     $com = "Select idlocal, locrazao from tb_local where locstatus = 0 order by locrazao, idlocal";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['idlocal'] . '">' . $lin['locrazao'] . '</option>'; 
     }
     return $sta;
}

function carrega_set() {
     $sta = 0;
     include_once "dados.php";    
     echo '<option value="0" selected="selected">Selecione setor desejado ...</option>';
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
     echo '<option value="0" selected="selected">Selecione cargo desejado ...</option>';
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
     echo '<option value="0" selected="selected">Selecione função desejada ...</option>';
     $com = "Select iddados, daddescricao from tb_dados where dadtipo = 1 and dadstatus = 0 order by daddescricao, iddados";
     $nro = leitura_reg($com, $reg);
     foreach ($reg as $lin) {
          echo  '<option value ="' . $lin['iddados'] . '">' . $lin['daddescricao'] . '</option>'; 
     }
     return $sta;
}

?>

</html>